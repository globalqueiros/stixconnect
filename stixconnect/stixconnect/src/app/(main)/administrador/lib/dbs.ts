import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "core_system", // troque pelo nome do seu banco
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
