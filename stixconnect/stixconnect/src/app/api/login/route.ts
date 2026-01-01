import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email / matrícula e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // Call Backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      const resBackend = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password })
      });

      const data = await resBackend.json();

      if (!resBackend.ok) {
        return NextResponse.json(
          { error: data.error || "Credenciais inválidas" },
          { status: resBackend.status }
        );
      }

      // Map backend user to StixConnect format
      const backendUser = data.user;

      // Determine route based on type
      let rota = '/dashboard';
      if (backendUser.tipo === 'medico') rota = '/medico/dashboard';
      else if (backendUser.tipo === 'enfermeira') rota = '/enfermeiro/dashboard';

      const stixUser = {
        id: backendUser.id,
        name: backendUser.nome,
        email: backendUser.email,
        token: data.token, // Store JWT for future API calls
        rota: rota,
        codPerfil: backendUser.tipo === 'medico' ? 4 : 5,
        nomePerfil: backendUser.tipo
      };

      return NextResponse.json({ user: stixUser }, { status: 200 });

    } catch (fetchError) {
      console.error("Erro ao conectar com backend:", fetchError);
      return NextResponse.json(
        { error: "Erro de comunicação com o servidor principal." },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
