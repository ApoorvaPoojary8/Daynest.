const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const habitsRouter = require('./routes/habits');
const checkInsRouter = require('./routes/checkIns');
const dashboardRouter = require('./routes/dashboard');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20kb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'habit-tracker-api' });
});
app.use('/api/habits', habitsRouter);
app.use('/api/habits', checkInsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
