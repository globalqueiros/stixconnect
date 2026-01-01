import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { RowDataPacket } from "mysql2";


export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total 
      FROM pacientes 
      WHERE promotora = 1 
      AND MONTH(created) = MONTH(CURRENT_DATE()) 
      AND YEAR(created) = YEAR(CURRENT_DATE());
    `);

    return NextResponse.json({ total: rows[0]?.total || 0 });
  } catch (error) {
    console.error("Erro ao contar pacientes:", error);
    return NextResponse.json({ error: "Erro ao contar pacientes" }, { status: 500 }); 
  }
}
