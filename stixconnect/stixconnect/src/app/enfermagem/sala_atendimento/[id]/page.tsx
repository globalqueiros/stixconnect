"use client";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Teste from "../../components/TesteDispositivos";
import Image from "next/image";

export default function SalaAtendimentoPage() {
  const params = useParams();
  const id = params.id as string;
  
  return (
    <div className="container-fluid px-4 mt-4">
      <h4 className="font-semibold text-base mb-0">
        Prontuário Online {id}
      </h4>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-3">
          <Teste />
        </div>
        <div className="max-w-lg flex flex-col gap-3">
          <h4 className="text-base text-center font-semibold">Ações do Atendimento</h4>
          <button className="rounded-full px-4 py-2.5 text-white font-semibold bg-[#00C853] hover:bg-[#00A844] transition">
            Transferir para Médico
          </button>
          <button className="rounded-full px-4 py-2.5 text-white font-semibold bg-[#00C853] hover:bg-[#00A844] transition">
            Transferir para Médico
          </button>
          <button className="rounded-full px-4 py-2.5 text-white font-semibold bg-[#00C853] hover:bg-[#00A844] transition">
            Transferir para Médico
          </button>
          <button className="rounded-full px-4 py-2.5 text-white font-semibold bg-[#00C853] hover:bg-[#00A844] transition">
            Transferir para Médico
          </button>
          <button className="rounded-full px-4 py-2.5 text-white font-semibold bg-[#00C853] hover:bg-[#00A844] transition">
            Transferir para Médico
          </button>
        </div>
      </div>
    </div>
  );
}
