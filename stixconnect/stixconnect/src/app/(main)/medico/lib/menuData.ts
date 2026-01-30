"use client";

export interface MenuItem {
  title: string;
  href: string;
  icon: string;
  isHeading?: boolean;
  hasSubmenu?: boolean;
  target?: string;
}

const routes: Record<number, string> = {
  1: "administrador/dashboard",
  2: "supervisor/dashboard",
  3: "atendente/dashboard",
  4: "medico/dashboard",
  5: "enfermeiro/dashboard",
  6: "fisioterapeuta/dashboard",
  7: "cuidador/dashboard",
  8: "nutricionista/dashboard",
  9: "cabeleireiro/dashboard",
  10: "psicologa/dashboard",
  11: "fonoaudiologa/dashboard",
  12: "acupuntura/dashboard",
  13: "psicopedagoga_clinica/dashboard",
};

export function getMenuData(): MenuItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const userLevel = Number(localStorage.getItem("userLevel")) || 4;
  const basePath = routes[userLevel] || "medico";

  const menuData: MenuItem[] = [
    { title: "Dashboard", href: `${basePath}/dashboard`, icon: "LayoutDashboard" },
    { title: "Consultas", href: `${basePath}/consultas`, icon: "BriefcaseMedical", hasSubmenu: true },
    { title: "Prontuários", href: `${basePath}/patients`, icon: "Users", hasSubmenu: true },
    { title: "Home Care / Domiciliar", href: `${basePath}/home_care`, icon: "HousePlus" },
    { title: "Exames e Resultados", href: `${basePath}/exame_resultados`, icon: "FileText" },
    { title: "Comunicação", href: `${basePath}/comunicacao`, icon: "MessagesSquare" },
    { title: "Relatórios", href: `${basePath}/relatorios`, icon: "ChartNoAxesCombined" },
    { title: "Benefícios", href: `${basePath}/beneficios`, icon: "HandCoins" },
    { title: "Suporte", href: `${basePath}/support`, icon: "BadgeInfo" },
    { title: "Slack", href: "https://corpqueiros.slack.com/", target: "_blank", icon: "Slack" },
    { title: "Sair", href: "/logout", icon: "LogOut" },
  ];

  return menuData;
}