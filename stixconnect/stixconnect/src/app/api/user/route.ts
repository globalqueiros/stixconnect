import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import pool from "../../lib/dbs";

export async function GET(req: NextRequest) {
  try {
    // Tentar obter token do NextAuth
    let token: any = null;
    try {
      token = await getToken({ req });
    } catch (tokenError) {
      // NextAuth pode não estar configurado, continuar com outras opções
      console.log("NextAuth não disponível, tentando outras opções...");
    }

    // Se não houver token do NextAuth, tentar buscar de outras fontes
    if (!token) {
      const cookies = req.headers.get("cookie") || "";
      
      // Tentar buscar de cookie de sessão legado (session_jws)
      const sessionMatch = cookies.match(/session_jws=([^;]+)/);
      if (sessionMatch) {
        // Se houver cookie de sessão legado, retornar 401 para que o frontend use o backend
        return NextResponse.json(
          { error: "Autenticação legada detectada. Use o backend FastAPI /auth/me" },
          { status: 401 }
        );
      }

      // Se não houver nenhum token, retornar 401 de forma clara
      return NextResponse.json(
        { error: "Não autenticado. Faça login primeiro." },
        { status: 401 }
      );
    }

    // Se chegou aqui, temos token do NextAuth
    const loginValue = token.email || token.codigo;

    if (!loginValue) {
      return NextResponse.json(
        { error: "Token inválido: email ou codigo não encontrado" },
        { status: 401 }
      );
    }

    const [rows]: any = await pool.query(
      "SELECT id, nome, email, foto FROM collab_system WHERE email = ? OR codigo = ? LIMIT 1",
      [loginValue, loginValue]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    const usuario = rows[0];

    return NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: usuario.foto,
    });

  } catch (error: any) {
    console.error("Erro no /api/user:", error);
    
    // Garantir que sempre retornamos JSON, nunca HTML
    return NextResponse.json(
      { 
        error: "Erro interno ao carregar usuário",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}