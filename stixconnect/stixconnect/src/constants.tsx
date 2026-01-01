import { Icon } from '@iconify/react';

type SideNavItem = {
  submenu?: any;
  title: React.ReactNode;
  path: string;
  icon: React.ReactNode;
};

export const SIDENAV_ITEMS: SideNavItem[] = [
  {
    title: <span className="text-black text-sm">Dashboard</span>,
    path: "/dashboard",
    icon: <Icon icon="lucide:home" className="text-black" width={16} height={16} />,
  },
  {
    title: <span className="text-black text-sm">Configurações</span>,
    path: "/configuracao",
    icon: <Icon icon="lucide:settings" className="text-black" width={16} height={16} />,
  },
  {
    title: <span className="text-black text-sm">Benefícios</span>,
    path: "/beneficios",
    icon: <Icon icon="lucide:hand-heart" className="text-black" width={16} height={16} />,
  },
  {
    title: <span className="text-black text-sm">Ajuda</span>,
    path: "/ajuda",
    icon: <Icon icon="lucide:help-circle" className="text-black" width={16} height={16} />,
  },
  {
    title: <span className="text-black text-sm">Sair</span>,
    path: "/sair",
    icon: <Icon icon="lucide:log-out" className="text-black" width={16} height={16} />,
  },
];