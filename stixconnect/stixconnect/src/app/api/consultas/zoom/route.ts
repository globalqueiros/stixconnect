import { NextResponse } from "next/server";
import pool from "../../../../lib/dbs";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT *
       FROM consultation 
       WHERE plataforma = 'zoom' 
       AND DATE(data_hora) = CURDATE()`
    );

    const total = rows.length;
    return NextResponse.json({ total, consultas: rows });
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    return NextResponse.json({ error: "Erro ao buscar consultas" }, { status: 500 });
  }
}
