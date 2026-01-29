const cron = require('node-cron');
const EmailParsingService = require('../services/emailParsingService');
const PaymentSettings = require('../models/PaymentSettings');

class PaymentVerificationCron {
  constructor() {
    this.emailParsingService = new EmailParsingService();
    this.isRunning = false;
  }

  // Start the cron job
  start() {
    console.log('🔄 Starting payment verification cron job...');
    
    // Run every 20 seconds
    this.cronJob = cron.schedule('*/20 * * * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Payment verification already running, skipping...');
        return;
      }

      await this.runPaymentVerification();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    console.log('✅ Payment verification cron job started (every 20 seconds)');
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Payment verification cron job stopped');
    }
  }

  // Run payment verification for all schools
  async runPaymentVerification() {
    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('🔍 Starting payment verification cycle...');

      // Get all schools with Gmail credentials configured
      const schoolsWithGmail = await PaymentSettings.find({
        'gmailCredentials.accessToken': { $exists: true, $ne: null },
        'gmailCredentials.refreshToken': { $exists: true, $ne: null },
      }).select('schoolId');

      console.log(`📧 Found ${schoolsWithGmail.length} schools with Gmail configured`);

      let totalProcessed = 0;
      let totalMatched = 0;
      const errors = [];

      // Process emails for each school
      for (const settings of schoolsWithGmail) {
        try {
          console.log(`🏫 Processing emails for school: ${settings.schoolId}`);
          
          const result = await this.emailParsingService.processNewEmailsForSchool(settings.schoolId);
          
          totalProcessed += result.processed;
          totalMatched += result.matched;

          if (result.processed > 0) {
            console.log(`✅ School ${settings.schoolId}: ${result.processed} processed, ${result.matched} matched`);
          }
        } catch (error) {
          console.error(`❌ Error processing school ${settings.schoolId}:`, error.message);
          errors.push({
            schoolId: settings.schoolId,
            error: error.message,
          });
        }
      }

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;

      console.log(`🎯 Payment verification cycle completed:`);
      console.log(`   📊 Total processed: ${totalProcessed}`);
      console.log(`   ✅ Total matched: ${totalMatched}`);
      console.log(`   ⏱️ Duration: ${duration.toFixed(2)}s`);
      console.log(`   ❌ Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log('🚨 Errors encountered:');
        errors.forEach(err => {
          console.log(`   - School ${err.schoolId}: ${err.error}`);
        });
      }

    } catch (error) {
      console.error('💥 Critical error in payment verification cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Manual trigger for testing
  async triggerManualVerification(schoolId = null) {
    console.log('🔧 Manual payment verification triggered');
    
    try {
      if (schoolId) {
        // Process specific school
        const result = await this.emailParsingService.processNewEmailsForSchool(schoolId);
        console.log(`✅ Manual verification for school ${schoolId}: ${result.processed} processed, ${result.matched} matched`);
        return result;
      } else {
        // Process all schools
        await this.runPaymentVerification();
      }
    } catch (error) {
      console.error('❌ Error in manual verification:', error);
      throw error;
    }
  }

  // Get cron job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob ? this.cronJob.running : false,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null,
    };
  }

  // Health check for Gmail credentials
  async healthCheck() {
    try {
      const schoolsWithGmail = await PaymentSettings.find({
        'gmailCredentials.accessToken': { $exists: true, $ne: null },
        'gmailCredentials.refreshToken': { $exists: true, $ne: null },
      }).select('schoolId gmailCredentials.tokenExpiry');

      const now = new Date();
      const expiredCredentials = schoolsWithGmail.filter(school => 
        school.gmailCredentials.tokenExpiry && 
        new Date(school.gmailCredentials.tokenExpiry) <= now
      );

      return {
        totalSchools: schoolsWithGmail.length,
        expiredCredentials: expiredCredentials.length,
        healthyCredentials: schoolsWithGmail.length - expiredCredentials.length,
        expiredSchools: expiredCredentials.map(s => s.schoolId),
      };
    } catch (error) {
      console.error('Error in health check:', error);
      return {
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const paymentVerificationCron = new PaymentVerificationCron();

module.exports = paymentVerificationCron;

