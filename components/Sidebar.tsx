
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Map as MapIcon, 
  Heart, 
  AlertCircle,
  LogOut
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout }) => {
  const menuItems = [
    { name: ViewType.DASHBOARD, icon: <LayoutDashboard size={20} /> },
    { name: ViewType.WEEKLY, icon: <Calendar size={20} /> },
    { name: ViewType.MAPS, icon: <MapIcon size={20} /> },
    { name: ViewType.ENGAGEMENT, icon: <Heart size={20} /> },
    { name: ViewType.GRIEVANCE, icon: <AlertCircle size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white/40 backdrop-blur-xl border-r border-white/20 flex flex-col">
      <div className="p-8">
        <h2 className="text-xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent uppercase tracking-tighter leading-none">
          Community<br/>Relations
        </h2>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onViewChange(item.name)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeView === item.name
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                : 'text-slate-500 hover:bg-teal-50 hover:text-teal-600'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};
