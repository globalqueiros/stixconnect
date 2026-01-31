"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { consultationService, Consulta, ConsultaStatus } from "@/app/services/consultation.service";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function MinhasConsultasPage() {
  const router = useRouter();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const data = await consultationService.getConsultations();
      setConsultas(data);
    } catch (err: any) {
      console.error("Erro ao carregar consultas:", err);
      setError("Erro ao carregar consultas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ConsultaStatus) => {
    const badges = {
      aguardando: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Aguardando" },
      em_triagem: { color: "bg-blue-100 text-blue-800", icon: AlertCircle, label: "Em Triagem" },
      aguardando_medico: { color: "bg-purple-100 text-purple-800", icon: Clock, label: "Aguardando Profissional" },
      em_atendimento: { color: "bg-indigo-100 text-indigo-800", icon: Clock, label: "Em Atendimento" },
      finalizada: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Finalizada" },
      cancelada: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Cancelada" },
    };

    const badge = badges[status] || badges.aguardando;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10C4B5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando consultas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Minhas Consultas</h1>
          <button
            onClick={() => router.push("/paciente/solicitar-consulta")}
            className="bg-[#10C4B5] text-white px-4 py-2 rounded-md font-medium hover:bg-[#0ea896] transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Consulta
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {consultas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma consulta encontrada
            </h2>
            <p className="text-gray-500 mb-6">
              Você ainda não possui consultas. Solicite uma nova consulta para começar.
            </p>
            <button
              onClick={() => router.push("/paciente/solicitar-consulta")}
              className="bg-[#10C4B5] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0ea896] transition-colors"
            >
              Solicitar Consulta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Agendamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enfermeiro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profissional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultas.map((consulta) => (
                  <tr key={consulta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{consulta.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        consulta.tipo === "urgente" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {consulta.tipo === "urgente" ? "Urgente" : "Agendada"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(consulta.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(consulta.data_agendamento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consulta.enfermeira?.nome || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consulta.medico?.nome || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {consulta.zoom_join_url && (
                        <a
                          href={consulta.zoom_join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#10C4B5] hover:text-[#0ea896] font-medium"
                        >
                          Entrar na Consulta
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
