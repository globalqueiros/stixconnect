import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const search =
    searchParams.get("q") ||
    searchParams.get("search") ||
    "";

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const db = pool; 
    const like = `%${search}%`;

    const [rows] = await db.execute(
      `SELECT 
        numProntuario,
        nome,
        dataNascimento AS data_nascimento,
        email,
        cpf,
        endereco,
        cidade
      FROM tb_paciente
      WHERE nome LIKE ? OR cpf LIKE ? OR numProntuario LIKE ?
      ORDER BY numProntuario DESC
      LIMIT ? OFFSET ?`,
      [like, like, like, limit, offset]
    );

    const [countRows]: any = await db.execute(
      `SELECT COUNT(*) AS total
      FROM tb_paciente
      WHERE nome LIKE ? OR cpf LIKE ? OR numProntuario LIKE ?`,
      [like, like, like]
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      results: rows,
      total,
      totalPages
    });

  } catch (err) {
    console.error("Erro ao consultar pacientes:", err);
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}