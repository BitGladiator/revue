const { Queue } = require('bullmq');

const connection = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379,
};

const reviewQueue = new Queue('pr-reviews', { connection });

const closeAllQueues = async () => {
  await reviewQueue.close();
};

module.exports = { reviewQueue, connection, closeAllQueues };