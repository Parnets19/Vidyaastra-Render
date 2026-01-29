const mongoose = require('mongoose');
const FeePayment = require('./models/FeePayment');
const PaymentLog = require('./models/PaymentLog');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
};

// Simulate payment verification for testing
const simulatePaymentVerification = async () => {
  try {
    // Find a pending payment
    const pendingPayment = await FeePayment.findOne({ status: 'pending' });
    
    if (!pendingPayment) {
      console.log('No pending payments found.');
      return;
    }
    
    console.log(`🔍 Found pending payment: ${pendingPayment._id}`);
    
    // Simulate payment verification (in real scenario, this would come from Gmail parsing)
    const transactionId = `TXN-${Date.now()}`;
    const payerUpi = 'test@paytm';
    
    // Create payment log entry
    const paymentLog = new PaymentLog({
      schoolId: pendingPayment.schoolId,
      rawEmailData: 'Simulated payment verification',
      transactionId,
      amount: pendingPayment.amount,
      payerUpi,
      emailSubject: 'Payment Confirmation',
      emailFrom: 'noreply@paytm.com',
      emailDate: new Date(),
      status: 'processing',
    });
    
    await paymentLog.save();
    
    // Update payment status
    pendingPayment.status = 'paid';
    pendingPayment.transactionId = transactionId;
    pendingPayment.payerUpiId = payerUpi;
    pendingPayment.paidDate = new Date();
    pendingPayment.receiptNumber = `RCP-${transactionId.slice(-6)}`;
    
    // Add to payment attempts
    pendingPayment.paymentAttempts.push({
      attemptDate: new Date(),
      amount: pendingPayment.amount,
      status: 'completed',
      transactionId,
    });
    
    await pendingPayment.save();
    
    // Update payment log with match
    paymentLog.matchedFeeId = pendingPayment.feeId;
    paymentLog.matchedStudentId = pendingPayment.studentId;
    paymentLog.status = 'matched';
    paymentLog.processingNotes = `Matched with payment ID: ${pendingPayment._id}`;
    
    await paymentLog.save();
    
    console.log('✅ Payment verification completed successfully!');
    console.log(`   Payment ID: ${pendingPayment._id}`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Amount: ₹${pendingPayment.amount}`);
    console.log(`   Status: ${pendingPayment.status}`);
    
  } catch (error) {
    console.error('❌ Error in payment verification:', error);
  }
};

// Run payment verification every 20 seconds
const startPaymentVerification = async () => {
  console.log('🔄 Starting payment verification service (every 20 seconds)...');
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    return;
  }
  
  // Run immediately
  await simulatePaymentVerification();
  
  // Then run every 20 seconds
  setInterval(async () => {
    console.log(`\n🔄 Running payment verification at ${new Date().toLocaleTimeString()}`);
    await simulatePaymentVerification();
  }, 20000); // 20 seconds
  
  console.log('✅ Payment verification service started');
};

// Start the service
startPaymentVerification();


