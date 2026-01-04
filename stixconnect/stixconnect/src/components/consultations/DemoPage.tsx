'use client';

import { useState } from 'react';
import CreateConsultation from './CreateConsultation';
import { ConsultaResponse } from '@/lib/types/consultas-criar';

export default function DemoPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastResponse, setLastResponse] = useState<ConsultaResponse | null>(null);

  const handleSuccess = (response: ConsultaResponse) => {
    setLastResponse(response);
    setShowSuccess(true);
  };

  const handleNewConsulta = () => {
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">StixConnect - Sistema de Consultas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Demo Mode</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!showSuccess ? (
            <>
              {/* Demo Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Sistema Completo de Criação de Consultas
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Esta demonstração mostra o fluxo completo de criação de consultas médicas, 
                  incluindo triagem para urgências e agendamento para consultas marcadas.
                </p>
              </div>

              {/* Create Consultation Component */}
              <CreateConsultation 
                onSuccess={handleSuccess}
                onCancel={() => console.log('Cancelado')}
              />
            </>
          ) : (
            /* Success Screen */
            <div className="space-y-8">
              {/* Success Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  ✅ Consulta Criada com Sucesso!
                </h2>
                <p className="text-lg text-gray-600">
                  O sistema registrou a consulta no banco de dados e atualizou o status conforme necessário.
                </p>
              </div>

              {/* Response Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Resposta</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">O que aconteceu?</h3>
                <div className="space-y-2 text-blue-800">
                  <div className="flex items-start">
                    <span className="mr-2">1.</span>
                    <div>
                      <strong>Criação no Banco:</strong> A consulta foi inserida na tabela <code>consultas</code> com todos os dados.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">2.</span>
                    <div>
                      <strong>Histórico de Status:</strong> O sistema registrou a mudança na tabela <code>consulta_status_history</code>.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">3.</span>
                    <div>
                      <strong>Atribuição Automática:</strong> Para urgências, o sistema tenta atribuir automaticamente uma enfermeira disponível.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">4.</span>
                    <div>
                      <strong>Notificação:</strong> O backend está pronto para enviar notificações aos profissionais disponíveis.
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleNewConsulta}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar Nova Consulta
                </button>
                <button
                  onClick={() => window.open('http://localhost:3001/api/test/pacientes', '_blank')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ver Pacientes (API)
                </button>
                <button
                  onClick={() => window.open('http://localhost:3001/api/test/profissionais-disponiveis?tipo=enfermeira', '_blank')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ver Profissionais (API)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            StixConnect - Sistema de Telemedicina • Demo v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}