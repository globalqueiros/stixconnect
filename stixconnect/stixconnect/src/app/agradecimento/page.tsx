'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Agradecimento() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta Finalizada!</h1>
          <p className="text-gray-600 mb-4">
            Obrigado por utilizar o StixConnect. Sua consulta foi realizada com sucesso.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">O que acontece agora?</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• Receberá um email com o resumo da consulta</li>
              <li>• A prescrição médica (se houver) será enviada por email</li>
              <li>• Seu prontuário foi atualizado</li>
              <li>• Pode agendar sua próxima consulta quando desejar</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              Esta página será redirecionada automaticamente em 10 segundos
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ animation: 'shrink 10s linear forwards' }}></div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => router.push('/paciente/historico')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Meu Histórico
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}