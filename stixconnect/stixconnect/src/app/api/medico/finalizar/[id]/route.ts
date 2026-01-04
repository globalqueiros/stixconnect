import { NextResponse } from "next/server";

// POST /api/medico/finalizar/{consultaId}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      dadosAnamnese, 
      dadosPrescricao, 
      dadosAtestado, 
      observacoesFinais 
    } = body;

    // Chamar endpoint do backend para finalizar consulta
    const response = await fetch(`http://localhost:3001/api/consultas/${id}/finalizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dados_anamnese: dadosAnamnese,
        dados_prescricao: dadosPrescricao,
        dados_atestado: dadosAtestado,
        observacoes: observacoesFinais
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao finalizar consulta:', error);
      return NextResponse.json(
        { error: 'Erro ao finalizar consulta' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      message: 'Consulta finalizada com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro no POST /api/medico/finalizar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}