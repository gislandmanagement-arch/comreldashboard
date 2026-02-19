
import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
  userPicture?: string;
}

export const Header: React.FC<HeaderProps> = ({ userName, userRole, userPicture }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white/30 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search communities, records, or files..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800">{userName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
          <img 
            src={userPicture || `https://picsum.photos/seed/${userName}/40/40`} 
            alt="Profile" 
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/20"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
