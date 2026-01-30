"use client";

import { useEffect, useState } from "react";
import { consultationService } from "@/app/services/consultation.service";
import { User, Calendar, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Atendimento {
  id: number;
  nome: string;
  tempo_espera: number;
  classificacao: string;
}

export default function PsicopedagogaClinicaDashboard() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAtendimentos() {
      setLoading(true);
      try {
        const consultations = await consultationService.getConsultations('pendente', 0, 100);
        const atendimentos = consultations.items.map((c: any) => ({
          id: c.id,
          nome: c.paciente?.nome || 'Paciente',
          tempo_espera: Math.floor((Date.now() - new Date(c.created_at).getTime()) / 60000),
          classificacao: c.classificacao_urgencia || 'normal',
        }));
        setAtendimentos(atendimentos);
      } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
        setAtendimentos([]);
      } finally {
        setLoading(false);
      }
    }
    loadAtendimentos();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard - Psicopedagoga Clínica</h1>
        <p className="text-gray-600 mt-1">Gerencie seus atendimentos e pacientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Atendimentos Pendentes</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{atendimentos.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Em Atendimento</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Hoje</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Atendimentos Pendentes</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10C4B5] mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : atendimentos.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum atendimento pendente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {atendimentos.map((atendimento) => (
                <div key={atendimento.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{atendimento.nome}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Tempo de espera: {atendimento.tempo_espera} minutos
                      </p>
                    </div>
                    <Link
                      href={`/psicopedagoga_clinica/atendimento/${atendimento.id}`}
                      className="bg-[#10C4B5] text-white px-4 py-2 rounded-lg hover:bg-[#0da89a] transition"
                    >
                      Iniciar Atendimento
                    </Link>
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
