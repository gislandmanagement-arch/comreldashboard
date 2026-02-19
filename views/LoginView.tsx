
import React from 'react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to start Google login. Please try again.');
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onLogin();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#e0f2f1] via-[#f3e5f5] to-[#e0f2f1] p-6">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 p-12 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-teal-200 mb-6">
            <span className="text-3xl font-bold text-white">CR</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 leading-none uppercase tracking-tighter">Community Relations</h1>
          <p className="text-slate-500 font-medium tracking-tight">Enterprise Relations Dashboard</p>
        </div>

        <p className="text-slate-600 mb-8 leading-relaxed">
          Access your community engagement metrics and relationship tools.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 px-6 rounded-2xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98]"
        >
          <img 
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
            alt="Google" 
            className="w-6 h-6"
          />
          Sign in with Google
        </button>

        <div className="mt-10 pt-8 border-t border-slate-100 text-xs text-slate-400">
          <p>© 2024 Community Relations Division. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
