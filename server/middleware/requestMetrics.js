const { v4: uuidv4 } = require('uuid');
const {
  httpRequestDuration,
  httpRequestTotal,
  httpErrorTotal,
} = require('../observability/metrics');
const logger = require('../observability/logger');

const requestMetrics = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id); 

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9; 

    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path.replace(/\/\d+/g, '/:id');

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) httpErrorTotal.inc(labels);

    const logData = {
      requestId: req.id,
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Math.round(durationSec * 1000),
      userId: req.userId,
      ip: req.ip,
    };

    if (res.statusCode >= 500) logger.error('Request failed', logData);
    else if (res.statusCode >= 400) logger.warn('Request error', logData);
    else if (durationSec > 1) logger.warn('Slow request', logData);
    else logger.info('Request completed', logData);
  });

  next();
};

module.exports = requestMetrics;