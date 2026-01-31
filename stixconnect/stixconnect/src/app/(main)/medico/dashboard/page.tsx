'use client';
import { useEffect, useState } from 'react';
import { SquareArrowOutUpRight, FileText } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { consultationService } from '@/app/services/consultation.service';
import { migrationHelper } from '@/app/lib/migration-helper';

interface Consulta {
  id: number;
  pacienteId: number;
  paciente: string;
  data_hora: Date;
  procedimento: string;
  zoom_link: string | null;
  zoom_join_url?: string | null;
  prontuario?: string | null;
  nome: string;
}

export default function AgendaCard() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [consultasSelecionadas, setConsultasSelecionadas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(new Date());

  useEffect(() => {
    async function fetchAgenda() {
      try {
        // Usar serviço de consultas do backend
        const data = await migrationHelper.getConsultationsWithFallback();

        // Normalizar dados do backend para formato esperado
        const formatadas = data.map((c: any) => ({
          id: c.id,
          pacienteId: c.paciente_id,
          paciente: c.paciente?.nome || 'Paciente',
          nome: c.paciente?.nome || 'Paciente',
          data_hora: new Date(c.data_agendamento || c.created_at),
          procedimento: c.tipo || 'Consulta',
          zoom_link: c.zoom_join_url || null,
          zoom_join_url: c.zoom_join_url,
          prontuario: c.paciente?.num_prontuario || null,
        }));

        setConsultas(formatadas);
        const hoje = new Date();
        const doDia = formatadas.filter((c: Consulta) => {
          const data = new Date(c.data_hora);
          return (
            data.getDate() === hoje.getDate() &&
            data.getMonth() === hoje.getMonth() &&
            data.getFullYear() === hoje.getFullYear()
          );
        });
        setConsultasSelecionadas(doDia);
      } catch (err) {
        console.error('Erro ao buscar agenda:', err);
        setError('Não foi possível carregar as consultas.');
      } finally {
        setLoading(false);
      }
    }

    fetchAgenda();
  }, []);

  const handleDateClick = (arg: any) => {
    const dataClicada = new Date(arg.dateStr);
    setDataSelecionada(dataClicada);
    const doDia = consultas.filter((c) => {
      const data = new Date(c.data_hora);
      return (
        data.getDate() === dataClicada.getDate() &&
        data.getMonth() === dataClicada.getMonth() &&
        data.getFullYear() === dataClicada.getFullYear()
      );
    });
    setConsultasSelecionadas(doDia);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div
        className="w-full h-64 rounded-2xl shadow-lg overflow-hidden flex flex-col"
        style={{
          backgroundImage: "url('/bemvindo.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start justify-center w-full">
        <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          <div className="p-6">
            <h5 className="text-base font-bold mb-3 text-black">
              {dataSelecionada
                ? `Consultas em ${dataSelecionada.toLocaleDateString('pt-BR')}`
                : 'Consultas do Dia'}
            </h5>
            {loading ? (
              <div className="p-3 text-base bg-gray-200 text-black rounded-lg text-center font-medium">
                Carregando...
              </div>
            ) : error ? (
              <div className="p-3 text-base bg-red-500 text-white rounded-lg text-center font-medium">
                {error}
              </div>
            ) : consultasSelecionadas.length === 0 ? (
              <div className="bg-yellow-500 text-sm text-white px-4 py-3 rounded-lg flex items-center gap-2"
                role="alert">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M5.22 19h13.56a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.48 16a2 2 0 001.74 3z"
                  />
                </svg>
                <p className="font-medium">Nenhuma consulta neste dia.</p>
              </div>
            ) : (
              <ul className="text-black space-y-3">
                {consultasSelecionadas.map((c) => (
                  <li key={`${c.id}-${c.data_hora.toISOString()}`}
                    className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition duration-150">
                    <div className="flex flex-col space-y-0.5">
                      <div className="text-gray-800">
                        <span className="font-bold">{c.nome}</span>{' '}
                        <span className="ml-1 text-sm text-gray-500">
                          {c.data_hora.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{c.procedimento}</span>
                    </div>
                    <div className="flex space-x-3">
                      {c.zoom_link || c.zoom_join_url ? (
                        <a
                          href={`/medico/consultorio_online?id=${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Entrar na Sala de Consulta"
                          className="p-2 text-sm text-white bg-[#25a096] rounded-full hover:bg-[#1e827a] transition duration-150 shadow-md"
                        >
                          <SquareArrowOutUpRight className="w-5 h-5" />
                        </a>
                      ) : null}
                      {c.prontuario ? (
                        <a
                          href={`/medico/prontuario/${c.prontuario}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver Prontuário"
                          className="p-2 text-sm text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-150 shadow-md"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      ) : (
                        <span 
                          title="Prontuário não disponível"
                          className="p-2 text-sm text-gray-400 bg-gray-100 rounded-full cursor-not-allowed"
                        >
                          <FileText className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-md p-4">
          <h1 className="text-lg font-bold mb-3 text-center text-black">
            Calendário de Consultas
          </h1>
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 border-4 border-t-transparent border-[#25a096] rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Carregando calendário...</p>
              </div>
            </div>
          ) : (
            <FullCalendar
              key={consultas.length}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={consultas.map((c) => ({
                id: `${c.id}-${c.data_hora.toISOString()}`,
                title: `${c.nome} - ${c.procedimento}`,
                start: c.data_hora,
                backgroundColor: '#10c4b5',
                borderColor: '#0f9e8a',
              }))}
              locale={ptBrLocale}
              height="60vh"
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                if (info.event.url) window.open(info.event.url, '_blank');
              }}
              eventContent={(arg) => (
                <div className="text-xs leading-tight">
                  <b>{arg.event.title.split(' - ')[0]}</b>
                  <div>{arg.event.title.split(' - ')[1]}</div>
                </div>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}