const { Pool } = require('pg');
const { dbQueryDuration } = require('../observability/metrics');

const query = async (text, params, queryName = 'unknown') => {
  const end = dbQueryDuration.startTimer({ query_name: queryName });
  try {
    const result = await pool.query(text, params);
    end();
    return result;
  } catch (err) {
    end();
    throw err;
  }
};
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});

module.exports = {
  query,
  getClient: () => pool.connect(),
  end: () => pool.end(),
};