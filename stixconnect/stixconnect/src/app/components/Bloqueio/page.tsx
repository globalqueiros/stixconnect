'use client';
import { useEffect } from 'react';

const BloquearConteudo: React.FC = () => {
  useEffect(() => {
    const prevenirSelecao = (e: Event) => e.preventDefault();

    document.body.onselectstart = prevenirSelecao;

    return () => {
      document.body.onselectstart = null;
    };
  }, []);

  return null;
};

export default BloquearConteudo;