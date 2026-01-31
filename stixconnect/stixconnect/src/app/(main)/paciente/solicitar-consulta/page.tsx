"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { consultationService, ConsultaTipo } from "@/app/services/consultation.service";

export default function SolicitarConsultaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    tipo: "urgente" as ConsultaTipo,
    data_agendamento: "",
    sintomas: "",
    temperatura: "",
    pressao_arterial: "",
    frequencia_cardiaca: "",
    saturacao_oxigenio: "",
    dor_escala: "",
    historico_medico: "",
    medicamentos_uso: "",
    alergias: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const consultaData: any = {
        tipo: formData.tipo,
      };

      // Se for agendada, adicionar data
      if (formData.tipo === "agendada" && formData.data_agendamento) {
        consultaData.data_agendamento = new Date(formData.data_agendamento).toISOString();
      }

      // Se houver sintomas ou dados de triagem, adicionar triagem
      if (formData.sintomas || formData.temperatura || formData.dor_escala) {
        consultaData.triagem = {
          sintomas: formData.sintomas || "Consulta solicitada",
          temperatura: formData.temperatura || undefined,
          pressao_arterial: formData.pressao_arterial || undefined,
          frequencia_cardiaca: formData.frequencia_cardiaca || undefined,
          saturacao_oxigenio: formData.saturacao_oxigenio || undefined,
          dor_escala: formData.dor_escala ? parseInt(formData.dor_escala) : undefined,
          historico_medico: formData.historico_medico || undefined,
          medicamentos_uso: formData.medicamentos_uso || undefined,
          alergias: formData.alergias || undefined,
        };
      }

      const consulta = await consultationService.createConsultation(consultaData);
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/paciente/minhas-consultas");
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao criar consulta:", err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        "Erro ao solicitar consulta. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Solicitar Consulta
          </h1>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              <p className="font-semibold">Consulta solicitada com sucesso!</p>
              <p className="text-sm mt-1">
                Você será redirecionado para suas consultas...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="font-semibold">Erro ao solicitar consulta</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Consulta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo"
                    value="urgente"
                    checked={formData.tipo === "urgente"}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ConsultaTipo })}
                    className="mr-2"
                    required
                  />
                  <span>Urgente</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo"
                    value="agendada"
                    checked={formData.tipo === "agendada"}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ConsultaTipo })}
                    className="mr-2"
                    required
                  />
                  <span>Agendada</span>
                </label>
              </div>
            </div>

            {/* Data de Agendamento (se for agendada) */}
            {formData.tipo === "agendada" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Hora Desejada *
                </label>
                <input
                  type="datetime-local"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                  required={formData.tipo === "agendada"}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {/* Dados de Triagem */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Informações para Triagem (Opcional)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sintomas / Queixa Principal
                  </label>
                  <textarea
                    value={formData.sintomas}
                    onChange={(e) => setFormData({ ...formData, sintomas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                    placeholder="Descreva seus sintomas ou motivo da consulta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C)
                    </label>
                    <input
                      type="text"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                      placeholder="Ex: 37.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pressão Arterial
                    </label>
                    <input
                      type="text"
                      value={formData.pressao_arterial}
                      onChange={(e) => setFormData({ ...formData, pressao_arterial: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                      placeholder="Ex: 120/80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência Cardíaca (bpm)
                    </label>
                    <input
                      type="text"
                      value={formData.frequencia_cardiaca}
                      onChange={(e) => setFormData({ ...formData, frequencia_cardiaca: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                      placeholder="Ex: 72"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saturação de Oxigênio (%)
                    </label>
                    <input
                      type="text"
                      value={formData.saturacao_oxigenio}
                      onChange={(e) => setFormData({ ...formData, saturacao_oxigenio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                      placeholder="Ex: 98"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escala de Dor (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.dor_escala}
                    onChange={(e) => setFormData({ ...formData, dor_escala: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                    placeholder="0 = sem dor, 10 = dor máxima"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histórico Médico
                  </label>
                  <textarea
                    value={formData.historico_medico}
                    onChange={(e) => setFormData({ ...formData, historico_medico: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                    placeholder="Doenças pré-existentes, cirurgias anteriores, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicamentos em Uso
                  </label>
                  <textarea
                    value={formData.medicamentos_uso}
                    onChange={(e) => setFormData({ ...formData, medicamentos_uso: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                    placeholder="Liste os medicamentos que você está tomando"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias
                  </label>
                  <textarea
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#10C4B5]"
                    placeholder="Liste suas alergias conhecidas"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#10C4B5] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0ea896] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Solicitando..." : "Solicitar Consulta"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
