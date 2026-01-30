import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email / matrícula e senha são obrigatórios." },
        { status: 400 }
      );
    }

    let user: any = null;
    let nroMatricula: string | null = null;

    const [rowsUsuario]: any = await pool.query(
      `
      SELECT u.*, p.nome AS nomePerfil, p.rota AS rotaPerfil
      FROM tb_usuario u
      LEFT JOIN tb_profile p ON p.idProfile = u.codPerfil
      WHERE u.email = ?
      LIMIT 1
      `,
      [email]
    );

    if (rowsUsuario.length > 0) {
      user = rowsUsuario[0];

      const [revendedorRows]: any = await pool.query(
        "SELECT nroMatricula FROM tb_revendedor WHERE nroMatricula = ? LIMIT 1",
        [user.id]
      );

      if (revendedorRows.length > 0)
        nroMatricula = revendedorRows[0].nroMatricula;
    }

    if (!user) {
      const [rowsRev]: any = await pool.query(
        "SELECT * FROM tb_revendedor WHERE nroMatricula = ? LIMIT 1",
        [email]
      );

      if (rowsRev.length === 0) {
        return NextResponse.json(
          { error: "Email / matrícula ou senha incorretos." },
          { status: 401 }
        );
      }

      nroMatricula = rowsRev[0].nroMatricula;
      const idUsuario = rowsRev[0].idUsuario;

      const [rowsUsuarioFromMat]: any = await pool.query(
        `
        SELECT u.*, p.nome AS nomePerfil, p.rota AS rotaPerfil
        FROM tb_usuario u
        LEFT JOIN tb_profile p ON p.idProfile = u.codPerfil
        WHERE u.id = ?
        LIMIT 1
        `,
        [idUsuario]
      );

      if (rowsUsuarioFromMat.length === 0) {
        return NextResponse.json(
          { error: "Usuário associado não encontrado." },
          { status: 500 }
        );
      }

      user = rowsUsuarioFromMat[0];
    }

    const senhaBanco = user.password;

    if (!senhaBanco) {
      return NextResponse.json(
        { error: "Erro no registro do usuário. Contate o suporte." },
        { status: 500 }
      );
    }

    const senhaCorreta = senhaBanco.startsWith("$2")
      ? await bcrypt.compare(password, senhaBanco)
      : senhaBanco === password;

    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Email / matrícula ou senha incorretos." },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json(
      {
        user: {
          ...safeUser,
          nroMatricula,
          codPerfil: user.codPerfil,
          nomePerfil: user.nomePerfil,
          rota: user.rotaPerfil,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
