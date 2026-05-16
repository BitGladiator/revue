const requestLogger = (req, res, next) => {
    const start = Date.now();
  
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, path, ip } = req;
      const { statusCode } = res;
  
      const color =
        statusCode >= 500 ? '\x1b[31m' :
        statusCode >= 400 ? '\x1b[33m' :
        '\x1b[32m';
  
      console.log(`${color}${method} ${path} ${statusCode}\x1b[0m — ${duration}ms — ${ip}`);
  
      if (duration > 1000) {
        console.warn(`SLOW REQUEST: ${method} ${path} took ${duration}ms`);
      }
    });
  
    next();
  };
  
module.exports = requestLogger;