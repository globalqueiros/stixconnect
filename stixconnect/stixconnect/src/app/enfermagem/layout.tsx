"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import NavBar from "./components/NavbarSlides";

export default function EnfermeiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <aside
        className={`
          h-screen fixed top-15 left-0 border-r bg-white
          transition-all duration-300 overflow-y-auto
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      <div
        className={`
          fixed top-0 z-20 bg-white w-full h-18 shadow-sm
          transition-all duration-300
        `}
        style={{
          left: collapsed ? "80px" : "256px",
          width: collapsed ? "calc(100% - 80px)" : "calc(100% - 256px)"
        }}
      >
        <NavBar collapsed={collapsed} />
      </div>

      <main
        className={`
          flex-1 mt-20 p-0 transition-all duration-300
          ${collapsed ? "ml-20" : "ml-64"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
