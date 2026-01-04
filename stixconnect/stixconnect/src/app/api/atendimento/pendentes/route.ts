import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Usar API de teste do backend (sem autenticação para compatibilidade)
    const response = await fetch('http://localhost:3001/api/test/consultas/aguardando?status=triagem,aguardando_enfermeira', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao buscar atendimentos pendentes:', response.status);
      return NextResponse.json([], { status: 200 });
    }

    const result = await response.json();
    
    // Formatar dados para compatibilidade com frontend existente
    if (result.success && result.data) {
      const formattedData = result.data.map((item: any) => ({
        id: item.id,
        nome: item.paciente_nome || item.nome,
        tempo_espera: Math.round(item.tempo_espera_minutos || 0),
        classificacao: item.classificacaoUrgencia || item.classificacao || 'verde',
        paciente_id: item.paciente_id || item.idPaciente,
        dados_triagem: item.dados_triagem || item.dados_triagem,
        status: item.status,
        tipo: item.tipo
      }));
      
      return NextResponse.json(formattedData);
    }

    return NextResponse.json([]);
    
  } catch (error) {
    console.error('Erro no GET /api/atendimento/pendentes:', error);
    return NextResponse.json([], { status: 500 });
  }
}
