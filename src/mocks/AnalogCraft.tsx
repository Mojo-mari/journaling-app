import React from 'react';
import { PenTool, Target, Bookmark, CheckSquare } from 'lucide-react';

const AnalogCraft = () => {
  return (
    <div className="min-h-screen bg-[#F0EBE3] p-6 md:p-12 font-serif relative overflow-hidden">
      {/* Paper Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

      <div className="max-w-4xl mx-auto bg-[#FCFBF7] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm min-h-screen relative border-l-0 md:border-l-[40px] border-[#E8E2D9]">
        {/* Ring Binder Simulation - Hidden on Mobile */}
        <div className="absolute left-[-28px] top-0 bottom-0 hidden md:flex flex-col justify-around py-10 z-20">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-[#D1C7BA] shadow-inner border border-[#C5B9AA]"></div>
          ))}
        </div>

        <main className="p-6 md:p-20">
          <header className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[#E8E2D9] pb-10 mb-12 md:mb-16">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center text-[#B5A591] mb-2 uppercase tracking-[0.2em] text-[10px] font-bold">
                <PenTool className="w-3 h-3 mr-2" />
                Journal Entry
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#5C5346] tracking-tight">Yearly Planning 2025</h1>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#5C5346] border-2 border-[#5C5346] px-3 py-1 rounded-md rotate-2 inline-block">
                DRAFT
              </div>
            </div>
          </header>

          <section className="mb-12 md:mb-20">
            <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B5A591] mb-6 md:mb-8 flex items-center">
              <Bookmark className="w-4 h-4 mr-2" />
              Theme & Intention
            </h2>
            <div className="p-6 md:p-10 bg-[#F9F7F2] border-2 border-[#E8E2D9] rounded-lg shadow-inner relative">
              <div className="absolute top-4 left-4 opacity-5 uppercase font-black text-4xl md:text-6xl italic select-none">Motto</div>
              <p className="text-xl md:text-3xl text-[#5C5346] leading-relaxed text-center italic relative z-10">
                “ 一歩ずつ、丁寧に。心に余白を、毎日に彩りを。”
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B5A591] mb-8 md:mb-10 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Strategic Milestones
            </h2>
            <div className="space-y-8 md:space-y-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start group">
                  <div className="mr-4 md:mr-6 mt-1 flex-shrink-0">
                    <div className="w-6 h-6 border-2 border-[#B5A591] rounded-md flex items-center justify-center group-hover:bg-[#B5A591] transition-colors cursor-pointer">
                      <CheckSquare className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-[#5C5346] mb-2 border-b border-[#E8E2D9] inline-block pr-6 md:pr-10">
                      {i === 1 ? '暮らしの質を高める' : i === 2 ? '学びの深化とアウトプット' : 'コミュニティへの貢献'}
                    </h3>
                    <p className="text-xs md:text-sm text-[#8C8376] mt-2 max-w-lg leading-relaxed">
                      Handwritten notes feel more personal. This space is for deep reflection and messy, beautiful planning.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Deco */}
          <footer className="mt-32 pt-10 border-t border-[#E8E2D9] flex justify-between items-center opacity-30">
            <div className="text-[10px] uppercase tracking-widest">Handcrafted with care</div>
            <div className="w-20 h-20 opacity-10">
              <img src="https://www.transparenttextures.com/patterns/handmade-paper.png" alt="" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AnalogCraft;

