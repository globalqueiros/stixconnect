'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';

interface Prontuario {
  consulta_id: number;
  data_hora: string;
  motivo: string;
  status: string;
  paciente_prontuario: string;
  paciente_nome: string;
  paciente_data_nascimento: string;
  paciente_sexo: string;
  paciente_telefone: string;
  paciente_whatsapp: string;
  paciente_email: string;
  paciente_rg: string;
  paciente_cpf: string;
  paciente_endereco: string;
}

export default function ProntuarioPage() {
  const params = useParams();
  const pront = params.pront as string;

  const [dados, setDados] = useState<Prontuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function carregarProntuario() {
      setLoading(true);
      setErro(null);

      try {
        const res = await fetch(`/api/prontuario/${pront}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao buscar prontuário');
        }

        setDados(data);
      } catch (err: any) {
        setErro(err.message);
        setDados(null);
      } finally {
        setLoading(false);
      }
    }

    if (pront) carregarProntuario();
  }, [pront]);

  function formatTelefone(telefone: string) {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      return telefone;
    }
  }

  function formatwhatsapp(telefone: string) {
    const numeros = telefone.replace(/\D/g, '');
    if (!numeros) return '';
    if (numeros.length <= 2) return `(${numeros})`;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }

  function formatCPF(cpf: string) {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }


  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10c2b3]"></div>
      </div>
    );

  if (erro)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center max-w-md">
          Erro: {erro}
        </div>
      </div>
    );

  if (!dados)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center max-w-md">
          Prontuário não encontrado.
        </div>
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex flex-col mt-2 px-4">
        <div className="my-3 text-left">
          <h2 className="text-xl mb-2 text-center font-semibold">Prontuário do Paciente</h2>
        </div>
      </div>
      <div className="bg-white rounded-xl text-base shadow p-3 space-y-2">
        <h6 className="text-base my-2 mt-2 font-normal">
          N° do Prontuário: <strong>{dados.paciente_prontuario}</strong>
        </h6>
        <div className="flex justify-between items-center border-b pb-2 my-4">
          <h6 className="text-xl font-semibold">Dados do Paciente</h6>
          <div className="bg-red-100 text-white-200 px-4 py-2 tracking-5 rounded-md text-sm">
            Modificação de informações indisponível.
          </div>
        </div>
        <div className="mt-3 flex gap-3 my flex-wrap">
          <p className="text-black">
            <strong>Paciente:</strong> {dados.paciente_nome}
          </p>
          <p className="text-black">
            <strong>Data de Nascimento:</strong>{' '}
            {new Date(dados.paciente_data_nascimento).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-black">
            <strong>Gênero:</strong> {dados.paciente_sexo}
          </p>
          <p className="text-black">
            <strong>Telefone:</strong> {' '}
            {dados.paciente_telefone
              ? formatTelefone(dados.paciente_telefone)
              : 'NÃO POSSUI'}
          </p>
          <p className="text-black">
            <strong>Whatsapp:</strong> {formatwhatsapp(dados.paciente_whatsapp)}<FontAwesomeIcon icon={fab.whatsapp} className="text-green-500" />
          </p>
          <p className="text-black">
            <strong>Email:</strong> {dados.paciente_email}
          </p>
          <p className="text-black">
            <strong>RG:</strong> {dados.paciente_rg}
          </p>
          <p className="text-black">
            <strong>CPF:</strong> {formatCPF(dados.paciente_cpf)}
          </p>
          <p className="text-black">
            <strong>Endereço:</strong> {dados.paciente_endereco}
          </p>
        </div>
      </div>
    </div>
  );
}
