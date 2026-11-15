require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/db');

const port = Number(process.env.PORT) || 5000;

async function start() {
  await connectDatabase();
  const server = app.listen(port, () => console.log(`Habit Tracker API listening on port ${port}`));

  async function shutdown(signal) {
    console.log(`${signal} received; closing server`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Failed to start API:', error.message);
  process.exit(1);
});
