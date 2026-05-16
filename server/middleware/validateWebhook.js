const { Webhooks } = require('@octokit/webhooks');

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET,
});

const validateWebhook = async (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  try {
    const body = req.body.toString();
    const isValid = await webhooks.verify(body, signature);

    if (!isValid) {
      console.warn(`Invalid webhook signature from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (err) {
    console.error('Webhook validation error:', err.message);
    return res.status(401).json({ error: 'Signature verification failed' });
  }
};

module.exports = validateWebhook;