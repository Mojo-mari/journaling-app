import React from 'react';
import { LayoutGrid, Sparkles, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

const BentoDashboard = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
              <LayoutGrid className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Journal Dashboard</h1>
          </div>
          <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-sm font-medium opacity-60">
            2025 Yearly Planning
          </div>
        </header>

        <main className="grid grid-cols-12 gap-6">
          {/* Main Theme Card */}
          <section className="col-span-12 md:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-sm border border-white hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
            <div className="flex items-center text-blue-500/60 mb-8 uppercase tracking-widest text-[10px] font-bold">
              <Sparkles className="w-4 h-4 mr-2" />
              Primary Focus
            </div>
            <div className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              A year of <span className="text-blue-500 italic">intentional</span> living and sustainable growth.
            </div>
          </section>

          {/* Stats/Status Card */}
          <section className="col-span-12 md:col-span-4 bg-blue-500 rounded-[2.5rem] p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <TrendingUp className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Completion Rate</h3>
              <div className="text-6xl font-bold my-4">74%</div>
              <p className="text-sm opacity-90 leading-relaxed">
                You are outperforming your Q1 targets. Keep the momentum!
              </p>
            </div>
          </section>

          {/* Goal Cards Grid */}
          {[1, 2, 3, 4, 5].map((i) => (
            <section key={i} className={`col-span-12 md:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 hover:shadow-paper-hover transition-all group cursor-pointer`}>
              <div className="flex justify-between items-start mb-4">
                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  {i}
                </span>
                <CheckCircle2 className="w-5 h-5 text-gray-200 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                {i === 1 ? 'Health & Vitality' : i === 2 ? 'Creative Projects' : i === 3 ? 'Deep Relationships' : i === 4 ? 'Financial Freedom' : 'Daily Mindfulness'}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                Specific actions and measurable milestones for this year's success.
              </p>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default BentoDashboard;




