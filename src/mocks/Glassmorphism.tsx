import React from 'react';
import { Sparkles, Target, Settings, Search } from 'lucide-react';

const Glassmorphism = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-300 rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <main className="w-full max-w-5xl bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <aside className="w-full md:w-20 bg-white/20 backdrop-blur-md border-r border-white/20 flex flex-col items-center py-10 space-y-10">
          <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-6 opacity-40">
            <Target className="w-6 h-6 cursor-pointer hover:opacity-100" />
            <Search className="w-6 h-6 cursor-pointer hover:opacity-100" />
            <Settings className="w-6 h-6 cursor-pointer hover:opacity-100" />
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-grow p-10 md:p-16 overflow-y-auto h-[80vh] no-scrollbar">
          <header className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 mb-2">Ocean of Thought</h1>
            <p className="text-slate-500 font-medium">Monday, 29 December 2025</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Theme Card */}
            <section className="col-span-1 md:col-span-2 bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/40 shadow-xl hover:bg-white/70 transition-all group">
              <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-500 mb-6 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Theme of the Year
              </h2>
              <div className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight group-hover:translate-x-2 transition-transform">
                Flow like water, constant in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">motion</span> yet deep in peace.
              </div>
            </section>

            {/* Sub Cards */}
            {[1, 2].map((i) => (
              <section key={i} className="bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/30 shadow-lg hover:translate-y-[-5px] transition-all cursor-pointer">
                <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {i === 1 ? 'Mastering the Ripple' : 'Deep Diving Research'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Focus on the micro-interactions and small habits that create big waves in your productivity.
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Glassmorphism;




