const { Pool } = require("pg");

const pooledConnectionString = process.env.NETLIFY_DATABASE_URL;
const unpooledConnectionString = process.env.NETLIFY_DATABASE_URL_UNPOOLED || pooledConnectionString;

if (!pooledConnectionString) {
  throw new Error("缺少数据库连接字符串：请在 Netlify 环境变量中设置 NETLIFY_DATABASE_URL。");
}

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: pooledConnectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 4,
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function withTransaction(handler) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pooledConnectionString,
  unpooledConnectionString,
  getPool,
  query,
  withTransaction,
};

