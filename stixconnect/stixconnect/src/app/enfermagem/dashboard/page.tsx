"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { User, ArrowLeft, ArrowRight, Video, Loader2 } from "lucide-react";

interface Atendimento {
  id: number;
  nome: string;
  tempo_espera: number;
  classificacao: string;
}

const ITEMS_PER_PAGE = 5;

export default function DashboardClient() {
  const [filteredTransactions, setFilteredTransactions] = useState<Atendimento[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/atendimento/pendentes")
      .then((res) => res.json())
      .then((data) => setFilteredTransactions(data))
      .catch(() => setFilteredTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTransactions]);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto p-6 flex justify-start">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
          <h2 className="text-base font-semibold mb-4">Atendimentos Pendentes</h2>
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center gap-2 text-base text-gray-500 py-6">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Carregando atendimentos...</span>
              </div>
            )}
            {!loading && currentItems.length === 0 && (
              <div className="flex items-center justify-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md font-semibold">
                <span>🚫</span> Todos os atendimentos foram realizados
              </div>
            )}
            {!loading &&
              currentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-black">{item.nome}</p>
                      <p className="text-xs text-gray-500">
                        Tempo estimado: {item.tempo_espera} min
                      </p>
                      <p className="text-xs font-semibold text-gray-600">
                        Classificação: {item.classificacao}
                      </p>
                    </div>
                  </div>
                  <Link href={`/enfermagem/sala_atendimento/${item.id}`}>
                    <Video className="w-6 h-6 text-black cursor-pointer hover:text-[#10c4b5]" />
                  </Link>
                </div>
              ))}
          </div>
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
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 disabled:opacity-50"
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