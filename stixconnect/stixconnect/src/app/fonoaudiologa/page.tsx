"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FonoaudiologaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/fonoaudiologa/dashboard");
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
