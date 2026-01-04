import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || '184.168.114.4',
  user: process.env.DB_USER || 'stix_prod_rw', 
  password: process.env.DB_PASSWORD || 't{UX9(x7s5*',
  database: process.env.DB_NAME || 'stixconnect',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;