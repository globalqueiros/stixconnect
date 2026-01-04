import { notFound } from 'next/navigation';
import { db } from '../../../lib/database';
import ConsultaPacienteClient from './ConsultaPacienteClient';

async function getConsultationData(id: string) {
  try {
    // Usar API de teste do backend (sem autenticação para compatibilidade)
    const response = await fetch(`http://localhost:3001/api/test/consulta/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro na API:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    console.log('Dados da consulta via API:', result);

    // Formatar dados para compatibilidade com frontend existente
    if (result.success && result.data) {
      const consulta = result.data;
      return {
        id: consulta.id.toString(),
        tipo: consulta.tipo,
        status: consulta.status,
        data_consulta: consulta.data_hora_inicio ? new Date(consulta.data_hora_inicio).toISOString().split('T')[0] : null,
        hora_consulta: consulta.data_hora_inicio ? new Date(consulta.data_hora_inicio).toTimeString().split(' ')[0].substring(0, 5) : null,
        paciente: {
          id: consulta.paciente?.id || consulta.paciente_id,
          nome: consulta.paciente?.nome || consulta.paciente_nome,
          cpf: consulta.paciente?.cpf || consulta.paciente_cpf,
          email: consulta.paciente?.email || consulta.paciente_email,
          whatsapp: consulta.paciente?.telefone || consulta.paciente_whatsapp
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    return null;
  }
}

export default async function ConsultaPaciente({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: consultationId } = await searchParams;

  if (!consultationId) {
    notFound();
  }

  const consultation = await getConsultationData(consultationId);

  if (!consultation) {
    notFound();
  }

  return <ConsultaPacienteClient initialConsultation={consultation} consultationId={consultationId} />;
}