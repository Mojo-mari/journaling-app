import React from 'react';
import { Target } from 'lucide-react';

const EditorialJournal = () => {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2C2C2C] font-serif selection:bg-[#EBD8C3]">
      {/* Editorial Header */}
      <header className="pt-24 pb-16 px-6 text-center border-b border-[#2C2C2C]/5 mb-16">
        <div className="text-[10px] tracking-[0.5em] uppercase font-sans mb-6 opacity-40">Issue No. 2025</div>
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 leading-none">
          The Annual Review
        </h1>
        <div className="max-w-2xl mx-auto h-[1px] bg-[#2C2C2C] my-10 opacity-10"></div>
        <p className="font-sans text-xs tracking-[0.2em] uppercase opacity-60">Paris • Tokyo • New York</p>
      </header>

      <main className="max-w-5xl mx-auto px-6 grid grid-cols-12 gap-12 pb-32">
        {/* Left Column: Theme */}
        <section className="col-span-12 md:col-span-4 border-r border-[#2C2C2C]/5 pr-12">
          <h2 className="text-[10px] tracking-widest uppercase font-sans font-bold mb-10 opacity-30 italic">Manifesto</h2>
          <div className="text-5xl font-bold leading-[0.9] tracking-tighter mb-8">
            LESS <br/>
            BUT <br/>
            BETTER.
          </div>
          <p className="text-sm leading-relaxed opacity-60 italic">
            Essentialism is not about how to get more things done; it's about how to get the right things done. 
            It doesn't mean just doing less for the sake of less either.
          </p>
        </section>

        {/* Right Column: Content */}
        <section className="col-span-12 md:col-span-8">
          <h2 className="text-[10px] tracking-widest uppercase font-sans font-bold mb-10 opacity-30 flex items-center">
            <Target className="w-3 h-3 mr-3" />
            Chapter I: Strategic Goals
          </h2>
          
          <div className="space-y-20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-sans italic mr-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">0{i}</span>
                  <h3 className="text-3xl font-bold tracking-tight border-b border-transparent group-hover:border-[#2C2C2C] transition-all">
                    {i === 1 ? 'Elevating Creative Standards' : i === 2 ? 'Deep Work Architecture' : 'Physical & Mental Equilibrium'}
                  </h3>
                </div>
                <div className="ml-16 grid grid-cols-2 gap-8 text-xs font-sans uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-all duration-700">
                  <div>Q1 Focus: Research & Foundation</div>
                  <div className="text-right">Estimated Completion: Dec 2025</div>
                </div>
              </div>
            ))}
          </div>

          {/* Editorial Quote */}
          <div className="mt-32 p-12 bg-[#F9F6F1] rounded-sm relative overflow-hidden">
            <span className="absolute -top-10 -left-5 text-[15rem] font-serif italic opacity-5 pointer-events-none">“</span>
            <blockquote className="text-2xl italic leading-relaxed text-center relative z-10">
              Your life is an editorial process. Cut the fluff, emphasize the substance, and publish your truth.
            </blockquote>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditorialJournal;




