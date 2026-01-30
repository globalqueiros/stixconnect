'use client';
import { useEffect } from 'react';

const VLibras = () => {
  useEffect(() => {
    // Verifica se o objeto window e o script VLibras estão disponíveis
    if (typeof window !== 'undefined' && !window.VLibras) {
      const script = document.createElement('script');
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;

      // Depois que o script for carregado, inicializa o widget
      script.onload = () => {
        if (window.VLibras) {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
      };

      // Adiciona o script ao body da página
      document.body.appendChild(script);

      // Limpeza: remove o script se o componente for desmontado
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []); // [] garante que o efeito seja executado apenas uma vez ao carregar a página

  return (
    <div>
      <div vw="true" className="enabled">
        <div vw-access-button="true" className="active"></div>
        <div vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>
    </div>
  );
};

export default VLibras;
