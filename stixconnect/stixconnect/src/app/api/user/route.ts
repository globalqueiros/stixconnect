import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "../../lib/dbs";

export async function GET(req: NextRequest) {
  try {
    const token: any = await getToken({ req });

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const loginValue = token.email || token.codigo;

    const [rows]: any = await pool.query(
      "SELECT id, nome, email, foto FROM collab_system WHERE email = ? OR codigo = ? LIMIT 1",
      [loginValue, loginValue]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const usuario = rows[0];

    return NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: usuario.foto,
    });

  } catch (error) {
    console.error("Erro no /api/user:", error);
    return NextResponse.json({ error: "Erro interno ao carregar usuário" }, { status: 500 });
  }
}