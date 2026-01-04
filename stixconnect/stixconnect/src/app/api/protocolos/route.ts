import { NextResponse } from "next/server";
import db from "../../../lib/database";

export async function GET() {
  try {
    const company = "Stixmed";

    const [rows]: any = await db.query(
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
