const helmet = require('helmet');
const compression = require('compression');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.github.com'],
      imgSrc:     ["'self'", 'https://avatars.githubusercontent.com', 'data:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const compress = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

module.exports = { securityHeaders, compress };