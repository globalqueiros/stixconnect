"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { consultationService, Consulta } from "@/app/services/consultation.service";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function PacienteDashboard() {
  const router = useRouter();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultas();
  }, []);

  const loadConsultas = async () => {
    try {
      const data = await consultationService.getConsultations();
      setConsultas(data);
    } catch (err) {
      console.error("Erro ao carregar consultas:", err);
    } finally {
      setLoading(false);
    }
  };

  const consultasAguardando = consultas.filter(c => 
    c.status === "aguardando" || c.status === "em_triagem" || c.status === "aguardando_medico"
  ).length;

  const consultasFinalizadas = consultas.filter(c => c.status === "finalizada").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Consultas em Andamento</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{consultasAguardando}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Consultas Finalizadas</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{consultasFinalizadas}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Consultas</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{consultas.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-[#10C4B5]" />
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/paciente/solicitar-consulta")}
              className="bg-[#10C4B5] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0ea896] transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Solicitar Nova Consulta
            </button>
            <button
              onClick={() => router.push("/paciente/minhas-consultas")}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Ver Todas as Consultas
            </button>
          </div>
        </div>

        {/* Últimas Consultas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Últimas Consultas</h2>
          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : consultas.length === 0 ? (
            <p className="text-gray-500">Nenhuma consulta encontrada.</p>
          ) : (
            <div className="space-y-4">
              {consultas.slice(0, 5).map((consulta) => (
                <div
                  key={consulta.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Consulta #{consulta.id} - {consulta.tipo === "urgente" ? "Urgente" : "Agendada"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className="font-medium">{consulta.status}</span>
                      </p>
                      {consulta.data_agendamento && (
                        <p className="text-sm text-gray-600">
                          Data: {new Date(consulta.data_agendamento).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                    {consulta.zoom_join_url && (
                      <a
                        href={consulta.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10C4B5] hover:text-[#0ea896] font-medium text-sm"
                      >
                        Entrar na Consulta
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
