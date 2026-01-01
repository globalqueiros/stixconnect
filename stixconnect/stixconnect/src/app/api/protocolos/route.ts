import { NextResponse } from "next/server";
import pool from "@/lib/des";

export async function GET() {
  try {
    const company = "Stixmed";

    const [rows]: any = await pool.query(
      "SELECT * FROM protocol WHERE company = ? ORDER BY created DESC LIMIT 3",
      [company]
    );

    console.log("Protocolos encontrados:", rows);

    return NextResponse.json({ protocolos: rows || [] });
  } catch (err) {
    console.error("Erro na consulta de protocolos:", err);
    return NextResponse.json({ protocolos: [] }, { status: 500 });
  }
}
