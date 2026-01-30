'use client';
import Image from 'next/image';
import { Mail, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Colaborador {
  id?: string;
  nome?: string;
  email?: string;
  foto?: string;
}

export function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<Colaborador | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erro ao buscar usuário.");
          return;
        }
        setUser(data);
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        setError("Erro ao conectar ao servidor.");
      }
    }

    fetchUser();
  }, []);

  return (
    <nav className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
      <div></div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Mail className="h-6 w-6 text-gray-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <Image
                src={user?.foto && user.foto.trim() !== "" ? user.foto : "/perfil.png"}
                alt={user?.nome || "Foto de Perfil"}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            </div>

            <span className="text-gray-700 text-sm hidden md:block">
              {user?.nome ? user.nome : error || "Carregando..."}
            </span>

            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 bg-white rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 transition-opacity duration-150 ease-out origin-top-right">
              <a
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-black hover:bg-[#10c4b5]"
              >
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </a>

              <a
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-black hover:bg-[#10c4b5]"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </a>

              <a
                href="/logout"
                className="flex items-center px-4 py-2 text-sm text-black hover:bg-[#10c4b5]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}