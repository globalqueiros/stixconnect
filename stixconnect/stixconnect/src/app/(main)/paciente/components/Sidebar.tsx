"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText,
  MessageSquare,
  HelpCircle
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/paciente/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Solicitar Consulta",
    href: "/paciente/solicitar-consulta",
    icon: Calendar,
  },
  {
    title: "Minhas Consultas",
    href: "/paciente/minhas-consultas",
    icon: FileText,
  },
  {
    title: "Comunicação",
    href: "/paciente/comunicacao",
    icon: MessageSquare,
  },
  {
    title: "Suporte",
    href: "/paciente/suporte",
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#10C4B5]">StixConnect</h1>
        <p className="text-sm text-gray-500 mt-1">Área do Paciente</p>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#10C4B5] text-white border-r-4 border-[#0ea896]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
