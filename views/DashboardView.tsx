
import React from 'react';

export const DashboardView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-white/40 text-center p-12">
      <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
        <svg 
          className="w-12 h-12 text-teal-600 animate-pulse" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
          />
        </svg>
      </div>
      <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Under Construction</h2>
      <p className="text-slate-500 max-w-md mx-auto text-lg">
        The main dashboard is currently being redesigned to provide better insights into your community relations.
      </p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
            <div className="h-3 w-2/3 bg-slate-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
