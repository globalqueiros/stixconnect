import { NextResponse } from "next/server";

// GET /api/medico/pacientes-encaminhados
export async function GET() {
  try {
    // Buscar pacientes encaminhados via API do backend
    const response = await fetch('http://localhost:3001/api/consultas/encaminhadas', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao buscar pacientes encaminhados:', response.status);
      return NextResponse.json([], { status: 200 });
    }

    const result = await response.json();
    
    // Formatar dados para compatibilidade com frontend
    if (result.success && result.data) {
      const formattedData = result.data.map((item: any) => ({
        id: item.id,
        nome: item.paciente_nome || item.nome,
        cpf: item.paciente_cpf || item.cpf,
        tempo_espera: Math.round(item.tempo_espera_minutos || 0),
        classificacao: item.classificacaoUrgencia || item.classificacao || 'verde',
        status: item.status || 'aguardando_medico',
        enfermeira_nome: item.enfermeira_nome || '',
        dados_triagem: item.dados_triagem || {},
        observacoes: item.observacoes || '',
        data_hora_inicio: item.data_hora_inicio,
        created_at: item.created_at,
        tipo: item.tipo || 'urgente'
      }));
      
      return NextResponse.json(formattedData);
    }

    return NextResponse.json([]);
    
  } catch (error) {
    console.error('Erro no GET /api/medico/pacientes-encaminhados:', error);
    return NextResponse.json([], { status: 500 });
  }
}