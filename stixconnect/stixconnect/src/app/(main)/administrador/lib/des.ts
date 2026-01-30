import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "198.12.223.77",
  user: "sawmasbom",
  password: "#vzESC8g-RpQ",
  database: "Y29sYWJvcmFkb3Jlcw",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
