import cron from 'node-cron';
import prisma from '../lib/prisma';

export const startVoucherCron = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running voucher expiration check...');
    try {
      const now = new Date();
      // Check for vouchers that are not used but expired
      const expiredVouchers = await prisma.voucher.findMany({
        where: {
          used: false,
          expiredAt: {
            lt: now,
          },
        },
      });

      if (expiredVouchers.length > 0) {
        console.log(`Found ${expiredVouchers.length} expired vouchers.`);
        // Note: The system already checks 'expiredAt' directly in queries, 
        // so no explicit database update is strictly required here unless a status field is added.
      } else {
        console.log('No expired vouchers found.');
      }
    } catch (error) {
      console.error('Error during voucher cron job:', error);
    }
  });
};
