import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const match = cookies.match(/session_jws=([^;]+)/);

    if (!match) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const token = match[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWS_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded.sub ||
      decoded.usuario ||
      decoded.idUsuario ||
      null;

    if (!userId) {
      return NextResponse.json(
        { error: "ID não encontrado no token" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows]: any = await connection.execute(
      `
        SELECT 
          p.nome AS perfil
        FROM tb_usuario u
        LEFT JOIN tb_profile p 
          ON u.codPerfil = p.idProfile
        WHERE u.idUsuario = ?
        LIMIT 1
      `,
      [userId]
    );

    await connection.end();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ perfil: rows[0].perfil });

  } catch (error) {
    console.error("ERRO /api/user:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}