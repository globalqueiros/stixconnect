import { NextResponse } from "next/server";

// POST /api/enfermagem/encaminhar/{consultaId}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { medicoId, observacoes = '' } = body;

    // Chamar endpoint do backend para encaminhar para médico
    const response = await fetch(`http://localhost:3001/api/consultas/${id}/encaminhar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'doctor',
        role: 'nurse',
        medicoId: medicoId,
        observacoes: observacoes
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao encaminhar para médico:', error);
      return NextResponse.json(
        { error: 'Erro ao encaminhar paciente para médico' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      message: 'Paciente encaminhado para médico com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro no POST /api/enfermagem/encaminhar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/enfermagem/medicos-disponiveis
export async function GET() {
  try {
    // Buscar médicos disponíveis via API do backend
    const response = await fetch('http://localhost:3001/api/test/profissionais-disponiveis?tipo=medico', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao buscar médicos disponíveis:', response.status);
      return NextResponse.json([], { status: 200 });
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const medicos = result.data.filter((p: any) => p.tipo === 'medico');
      return NextResponse.json(medicos);
    }

    return NextResponse.json([]);

  } catch (error) {
    console.error('Erro no GET /api/enfermagem/medicos-disponiveis:', error);
    return NextResponse.json([], { status: 500 });
  }
}