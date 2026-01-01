"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  MonitorCog,
  FileText,
  Calendar,
  Package,
  CalendarDays,
  Logs,
  LogOut,
} from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const menu: MenuItem[] = [
  { label: "Dashboard", href: "/enfermagem/dashboard", icon: <Home size={20} /> },
  { label: "Prontuário", href: "/enfermagem/prontuario", icon: <Users size={20} /> },
  { label: "Pedidos", href: "/enfermagem/pedidos", icon: <Logs size={20} /> },
  { label: "Agenda", href: "/enfermagem/agenda", icon: <CalendarDays size={20} /> },
  { label: "Atendimentos", href: "/enfermagem/atendimentos", icon: <MonitorCog size={20} /> },
  { label: "Documentos", href: "/enfermagem/documentos", icon: <FileText size={20} /> },
  { label: "Materiais", href: "/enfermagem/materiais", icon: <Calendar size={20} /> },
  { label: "Relatórios", href: "/enfermagem/relatorios", icon: <Package size={20} /> },
  { label: "Sair", href: "/enfermagem/sair", icon: <LogOut size={20} /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/usuario");
        const data = await res.json();
        if (data?.nome) setUserName(data.nome);
      } catch (error) {
        console.error("Erro ao carregar prontuário :", error);
      }
    }
    loadUser();
  }, []);

  return (
    <aside
      className={`h-screen border-r bg-white fixed top-0 left-0 flex flex-col justify-between 
      transition-all duration-300 z-10 py-6 overflow-y-auto
      ${collapsed ? "w-20 px-2" : "w-64 px-4"}`}
    >
      <div>
        <div className="flex justify-center items-center mb-5">
          <Image src="/logo.png" width={155} height={155} alt="Logo Stixmed" />
        </div>

        <nav className="space-y-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-gray-100 transition 
              ${collapsed ? "justify-center" : ""}
              ${pathname === item.href ? "bg-[#10C4B5] text-white" : "text-gray-600"}`}
            >
              <span className="group-hover:text-[#10C4B5]">{item.icon}</span>

              {!collapsed && (
                <span
                  className={`capitalize group-hover:text-[#10C4B5] ${
                    pathname === item.href ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-2">
        <div
          className={`flex items-center p-2 rounded-lg cursor-default 
        ${collapsed ? "justify-center" : "space-x-3 hover:bg-gray-100"}`}
        >
          <div className="w-8 h-8 bg-[#10c4b5] rounded-full flex items-center justify-center text-white font-semibold">
            {userName ? userName.charAt(0).toUpperCase() : "?"}
          </div>
          {!collapsed && <span className="text-sm">{userName || "Carregando..."}</span>}
        </div>
      </div>
    </aside>
  );
}
