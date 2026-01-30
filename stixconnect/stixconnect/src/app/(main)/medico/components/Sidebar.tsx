"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { SidebarItem } from "./SidebarItem";
import { getMenuData, MenuItem } from "../lib/menuData";

export function Sidebar() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const data = getMenuData();
    setMenuData(data);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-black-800 overflow-y-auto"
      style={{ zIndex: 10 }}
    >
      <div className="flex items-center justify-center p-3 border-b border-gray-200">
        <Image
          src="/logo.png"
          alt="Logo Stixmed"
          width={120}
          height={30}
          priority
          className="object-contain"
        />
      </div>

      <nav className="flex flex-col py-2">
        {menuData.length > 0 ? (
          menuData.map((item) => (
            <SidebarItem key={item.title} item={item} />
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center mt-4">Carregando menu...</p>
        )}
      </nav>

      <div className="absolute bottom-0 text-xs w-full p-4 text-center text-black-400">
        <strong>Versão: 1.5.0</strong> &copy; {currentYear} Stixmed Assistência Domiciliar LTDA.
      </div>
    </div>
  );
}