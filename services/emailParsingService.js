const { google } = require('googleapis');
const GmailOAuthService = require('./gmailOAuthService');
const PaymentSettings = require('../models/PaymentSettings');
const PaymentLog = require('../models/PaymentLog');
const FeePayment = require('../models/FeePayment');
const Fee = require('../models/feeModel');

class EmailParsingService {
  constructor() {
    this.oauthService = new GmailOAuthService();
    this.gmail = google.gmail({ version: 'v1' });
  }

  // Parse UPI payment emails from various providers
  parseUpiPaymentEmail(emailContent, subject, from) {
    const paymentData = {
      transactionId: null,
      amount: null,
      payerUpi: null,
      payeeUpi: null,
      timestamp: null,
      provider: this.detectProvider(from),
    };

    // Common patterns for UPI transaction IDs
    const transactionIdPatterns = [
      /Transaction ID[:\s]*([A-Z0-9]{8,12})/i,
      /Txn ID[:\s]*([A-Z0-9]{8,12})/i,
      /Ref No[:\s]*([A-Z0-9]{8,12})/i,
      /UTR[:\s]*([A-Z0-9]{8,12})/i,
      /([A-Z0-9]{8,12})/g, // Generic pattern
    ];

    // Amount patterns
    const amountPatterns = [
      /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /Rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /INR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*rupees?/gi,
    ];

    // UPI ID patterns
    const upiIdPatterns = [
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/g,
      /UPI ID[:\s]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
    ];

    // Extract transaction ID
    for (const pattern of transactionIdPatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        paymentData.transactionId = match[1] || match[0];
        break;
      }
    }

    // Extract amount
    for (const pattern of amountPatterns) {
      const matches = emailContent.match(pattern);
      if (matches) {
        // Take the largest amount found (likely the transaction amount)
        const amounts = matches.map(match => {
          const amountStr = match.replace(/[₹Rs.,]/g, '');
          return parseFloat(amountStr);
        });
        paymentData.amount = Math.max(...amounts);
        break;
      }
    }

    // Extract UPI IDs
    for (const pattern of upiIdPatterns) {
      const matches = emailContent.match(pattern);
      if (matches) {
        paymentData.payerUpi = matches[0];
        if (matches.length > 1) {
          paymentData.payeeUpi = matches[1];
        }
        break;
      }
    }

    // Extract timestamp
    const timestampPatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i,
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
    ];

    for (const pattern of timestampPatterns) {
      const match = emailContent.match(pattern);
      if (match) {
        paymentData.timestamp = new Date(match[1]);
        break;
      }
    }

    return paymentData;
  }

  // Detect UPI payment provider from email sender
  detectProvider(from) {
    const providers = {
      'googlepay': ['noreply@googlepay.com', 'notifications@googlepay.com'],
      'phonepe': ['noreply@phonepe.com', 'alerts@phonepe.com'],
      'paytm': ['noreply@paytm.com', 'alerts@paytm.com'],
      'bharatpe': ['noreply@bharatpe.com'],
      'mobikwik': ['noreply@mobikwik.com'],
      'freecharge': ['noreply@freecharge.com'],
    };

    const fromLower = from.toLowerCase();
    for (const [provider, emails] of Object.entries(providers)) {
      if (emails.some(email => fromLower.includes(email))) {
        return provider;
      }
    }

    return 'unknown';
  }

  // Check if email is a UPI payment confirmation
  isUpiPaymentEmail(subject, from, content) {
    const upiKeywords = [
      'payment received',
      'money received',
      'upi payment',
      'transaction successful',
      'payment confirmation',
      'amount credited',
      'funds received',
      'payment completed',
    ];

    const subjectLower = subject.toLowerCase();
    const contentLower = content.toLowerCase();

    return upiKeywords.some(keyword => 
      subjectLower.includes(keyword) || contentLower.includes(keyword)
    );
  }

  // Fetch and process new emails for a school
  async processNewEmailsForSchool(schoolId) {
    try {
      const paymentSettings = await PaymentSettings.findOne({ schoolId });
      
      if (!paymentSettings || !paymentSettings.gmailCredentials.accessToken) {
        console.log(`No Gmail credentials found for school ${schoolId}`);
        return { processed: 0, matched: 0 };
      }

      // Check if token needs refresh
      if (this.oauthService.isTokenExpired(paymentSettings.gmailCredentials.tokenExpiry)) {
        console.log(`Refreshing token for school ${schoolId}`);
        const newTokens = await this.oauthService.refreshAccessToken(
          paymentSettings.gmailCredentials.refreshToken
        );
        
        paymentSettings.gmailCredentials.accessToken = newTokens.access_token;
        paymentSettings.gmailCredentials.tokenExpiry = new Date(newTokens.expiry_date);
        await paymentSettings.save();
      }

      // Set up Gmail client with credentials
      this.oauthService.oauth2Client.setCredentials({
        access_token: paymentSettings.gmailCredentials.accessToken,
        refresh_token: paymentSettings.gmailCredentials.refreshToken,
      });

      this.gmail = google.gmail({ 
        version: 'v1', 
        auth: this.oauthService.oauth2Client 
      });

      // Search for unread emails from UPI providers
      const query = 'is:unread from:(googlepay.com OR phonepe.com OR paytm.com OR bharatpe.com OR mobikwik.com OR freecharge.com) subject:(payment OR transaction OR received OR credited)';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10,
      });

      const messages = response.data.messages || [];
      let processedCount = 0;
      let matchedCount = 0;

      for (const message of messages) {
        try {
          const messageData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const headers = messageData.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          // Get email content
          const content = this.extractEmailContent(messageData.data.payload);

          // Check if it's a UPI payment email
          if (this.isUpiPaymentEmail(subject, from, content)) {
            const paymentData = this.parseUpiPaymentEmail(content, subject, from);

            if (paymentData.transactionId && paymentData.amount) {
              // Check if we've already processed this transaction
              const existingLog = await PaymentLog.findOne({
                transactionId: paymentData.transactionId,
                schoolId,
              });

              if (!existingLog) {
                // Process payment verification
                const result = await this.processPaymentVerification({
                  schoolId,
                  rawEmailData: content,
                  transactionId: paymentData.transactionId,
                  amount: paymentData.amount,
                  payerUpi: paymentData.payerUpi,
                  emailSubject: subject,
                  emailFrom: from,
                  emailDate: date,
                });

                processedCount++;
                if (result.matched) {
                  matchedCount++;
                }

                // Mark email as read
                await this.gmail.users.messages.modify({
                  userId: 'me',
                  id: message.id,
                  resource: {
                    removeLabelIds: ['UNREAD'],
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }

      return { processed: processedCount, matched: matchedCount };
    } catch (error) {
      console.error(`Error processing emails for school ${schoolId}:`, error);
      throw error;
    }
  }

  // Extract text content from email payload
  extractEmailContent(payload) {
    let content = '';

    if (payload.body && payload.body.data) {
      content += Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          content += Buffer.from(part.body.data, 'base64').toString();
        } else if (part.parts) {
          content += this.extractEmailContent(part);
        }
      }
    }

    return content;
  }

  // Process payment verification (similar to controller method)
  async processPaymentVerification(paymentData) {
    const {
      schoolId,
      rawEmailData,
      transactionId,
      amount,
      payerUpi,
      emailSubject,
      emailFrom,
      emailDate,
    } = paymentData;

    // Create payment log entry
    const paymentLog = new PaymentLog({
      schoolId,
      rawEmailData: rawEmailData || '',
      transactionId,
      amount,
      payerUpi,
      emailSubject,
      emailFrom,
      emailDate: emailDate ? new Date(emailDate) : new Date(),
      status: 'processing',
    });

    await paymentLog.save();

    // Try to match with pending payments
    const matchedPayment = await this.matchPaymentWithPendingFees(
      schoolId,
      amount,
      payerUpi,
      transactionId
    );

    if (matchedPayment) {
      // Update payment log with match
      paymentLog.matchedFeeId = matchedPayment.feeId;
      paymentLog.matchedStudentId = matchedPayment.studentId;
      paymentLog.status = 'matched';
      paymentLog.processingNotes = `Matched with payment ID: ${matchedPayment._id}`;

      // Update fee payment status
      matchedPayment.status = 'paid';
      matchedPayment.transactionId = transactionId;
      matchedPayment.payerUpiId = payerUpi;
      matchedPayment.paidDate = new Date();
      matchedPayment.receiptNumber = `RCP-${transactionId.slice(-6)}`;

      // Add to payment attempts
      matchedPayment.paymentAttempts.push({
        attemptDate: new Date(),
        amount: matchedPayment.amount,
        status: 'completed',
        transactionId,
      });

      await matchedPayment.save();

      // Update fee installment
      await this.updateFeeInstallment(matchedPayment.feeId, matchedPayment.installmentIndex, {
        status: 'paid',
        paidDate: new Date(),
        receiptNumber: matchedPayment.receiptNumber,
        paymentMethod: 'upi',
      });

      await paymentLog.save();

      return { matched: true, paymentLog, matchedPayment };
    } else {
      // No match found
      paymentLog.status = 'unmatched';
      paymentLog.processingNotes = 'No matching pending payment found';
      await paymentLog.save();

      return { matched: false, paymentLog };
    }
  }

  // Helper function to match payment with pending fees
  async matchPaymentWithPendingFees(schoolId, amount, payerUpi, transactionId) {
    // First, try exact amount match
    let payment = await FeePayment.findOne({
      schoolId,
      amount,
      status: 'pending',
    });

    if (payment) {
      return payment;
    }

    // If no exact match, try to find payments within a reasonable time window
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    payment = await FeePayment.findOne({
      schoolId,
      amount,
      status: 'pending',
      createdAt: { $gte: oneDayAgo },
    });

    return payment;
  }

  // Helper function to update fee installment
  async updateFeeInstallment(feeId, installmentIndex, updateData) {
    const fee = await Fee.findById(feeId);
    if (fee && fee.installments[installmentIndex]) {
      Object.assign(fee.installments[installmentIndex], updateData);
      await fee.save();
    }
  }
}

module.exports = EmailParsingService;

