"use client";
import { useEffect, useState } from "react";
import { Bell, Mail } from "lucide-react";

export default function NavbarSlides() {
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPerfil, setUserPerfil] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/usuario", { cache: "no-store" });

        if (!res.ok) {
          console.error("Erro da API:", await res.json());
          return;
        }

        const data = await res.json();
        setUserName(data?.nome ?? "Usuário");
        setUserPerfil(data?.perfil ?? "Em Breve");
        setUserPhoto(data?.foto ?? null);

      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="w-full flex justify-end p-3 mr-3 bg-white shadow relative">
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            setOpenNotifications(!openNotifications);
            setOpenProfile(false);
          }}
          className="relative"
        >
          <Bell className="w-5 h-5 text-gray-700" />
        </button>

        <button className="relative">
          <Mail className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={() => {
            setOpenProfile(!openProfile);
            setOpenNotifications(false);
          }}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200"
        >
          <img
            src={userPhoto || "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&facepad=2&w=300&h=300"}
            alt="profile"
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      {openProfile && (
        <div className="absolute top-16 right-4 w-64 bg-white rounded-xl shadow-xl border animate-slide-down p-3 z-20">
          <div className="bg-[#10c4b5] text-white p-2.5 rounded-lg mb-3">
            <p className="font-semibold text-lg my-1">
              {userName || "Carregando..."}
            </p>
            <p className="text-sm opacity-90 mb-1">
              {userPerfil || "Carregando..."}
            </p>
          </div>
          <ul className="space-y-1 text-base text-black">
            <li><a className="text-black hover:font-bold cursor-pointer" href="/perfil">Perfil</a></li>
            <li><a className="text-black hover:font-bold cursor-pointer" href="/configuracoes">Configurações</a></li>
            <li><a className="text-black hover:font-bold cursor-pointer" href="/sair">Sair</a></li>
          </ul>
        </div>
      )}

      {openNotifications && (
        <div className="absolute top-16 right-20 w-80 bg-white rounded-xl shadow-xl border animate-slide-down p-4 z-20 max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-black tracking-6 mb-3">Notificações</h4>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <img src={ userPhoto || "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&facepad=2&w=100&h=100"}
                className="w-9 h-9 rounded-full"/>
              <div>
                <p className="text-base font-medium text-gray-800">Nova atualização</p>
                <p className="text-xs text-black">
                  Clique para visualizar os detalhes
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .animate-slide-down {
          animation: slideDown 0.25s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}