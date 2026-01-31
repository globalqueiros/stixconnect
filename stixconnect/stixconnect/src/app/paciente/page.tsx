"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PacienteRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a rota correta baseada no role do usuário
    const userLevel = Number(localStorage.getItem("userLevel")) || 4;
    
    // Mapear para a rota correta baseada no role
    const routes: Record<number, string> = {
      1: "/administrador/patients",
      2: "/supervisor/patients",
      3: "/atendente/patients",
      4: "/medico/patients",
      5: "/enfermagem/prontuario",
      6: "/fisioterapeuta/patients",
      7: "/cuidador/patients",
      8: "/nutricionista/patients",
      9: "/cabeleireiro/patients",
      10: "/psicologa/patients",
      11: "/fonoaudiologa/patients",
      12: "/acupuntura/patients",
      13: "/psicopedagoga_clinica/patients",
      15: "/paciente/dashboard", // Role de paciente - redireciona para dashboard
    };

    const redirectPath = routes[userLevel] || "/paciente/dashboard";
    router.replace(redirectPath);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10C4B5] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
