const mysql = require('mysql2/promise');
require('dotenv').config();

// configurasi ke cloud sql
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// create connection pool
const pool = mysql.createPool(dbConfig);

module.exports = pool;