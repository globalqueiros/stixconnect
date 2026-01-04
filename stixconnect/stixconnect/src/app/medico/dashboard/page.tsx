"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { User, ArrowLeft, ArrowRight, Video, Loader2, Clock, Activity, FileText } from "lucide-react";

interface PacienteEncaminhado {
  id: number;
  nome: string;
  cpf: string;
  tempo_espera: number;
  classificacao: string;
  status: string;
  enfermeira_nome: string;
  dados_triagem: {
    sintomas: string;
    duracaoSintomas: string;
    intensidadeDor: string;
  };
  observacoes: string;
  data_hora_inicio: string;
  tipo: string;
}

const ITEMS_PER_PAGE = 5;

export default function DashboardMedico() {
  const [pacientes, setPacientes] = useState<PacienteEncaminhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    carregarPacientesEncaminhados();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pacientes]);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const carregarPacientesEncaminhados = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/medico/pacientes-encaminhados");
      const data = await response.json();
      setPacientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(pacientes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = pacientes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const getClassificacaoCor = (classificacao: string) => {
    switch (classificacao) {
      case 'verde':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'amarelo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'laranja':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'vermelho':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusCor = (status: string) => {
    switch (status) {
      case 'aguardando_medico':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'atendimento_medico':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatarTempoEspera = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto p-6 flex justify-start">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Pacientes Encaminhados</h2>
            <button
              onClick={carregarPacientesEncaminhados}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Atualizar
            </button>
          </div>
          
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center gap-2 text-base text-gray-500 py-6">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Carregando pacientes...</span>
              </div>
            )}
            
            {!loading && currentItems.length === 0 && (
              <div className="flex items-center justify-center gap-2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md font-semibold">
                <Activity className="w-4 h-4" />
                <span>Nenhum paciente encaminhado no momento</span>
              </div>
            )}
            
            {!loading &&
              currentItems.map((paciente) => (
                <div key={paciente.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{paciente.nome}</p>
                        <p className="text-xs text-gray-500">{paciente.cpf}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificacaoCor(paciente.classificacao)}`}>
                        {paciente.classificacao.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusCor(paciente.status)}`}>
                        {paciente.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Tempo de espera: </span>
                      <span className="font-medium">{formatarTempoEspera(paciente.tempo_espera)}</span>
                    </div>
                    
                    {paciente.enfermeira_nome && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Encaminhado por: </span>
                        <span className="font-medium">{paciente.enfermeira_nome}</span>
                      </div>
                    )}
                    
                    {paciente.tipo && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">Tipo: </span>
                        <span className="font-medium">{paciente.tipo === 'urgente' ? 'Urgência' : 'Agendado'}</span>
                      </div>
                    )}
                  </div>

                  {paciente.dados_triagem?.sintomas && (
                    <div className="bg-gray-50 rounded p-2 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Sintomas principais:</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{paciente.dados_triagem.sintomas}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Link href={`/medico/consulta/${paciente.id}`}>
                      <Video className="w-6 h-6 text-blue-600 hover:text-blue-800 cursor-pointer" />
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          {/* Paginação */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 disabled:opacity-50"
                aria-label="Página anterior"
              >
                <ArrowLeft size={18} />
              </button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 disabled:opacity-50"
                aria-label="Próxima página"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}