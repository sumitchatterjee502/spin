/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  dialect: 'mysql',
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
