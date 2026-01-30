import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows]: any = await connection.execute(
      "SELECT nome FROM tb_usuario LIMIT 1"
    );

    await connection.end();

    return NextResponse.json(rows[0] || null);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 });
  }
}
