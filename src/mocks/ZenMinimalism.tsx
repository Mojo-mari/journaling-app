import React from 'react';
import { Sparkles, Target, Calendar } from 'lucide-react';

const ZenMinimalism = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-serif p-8 md:p-16">
      <header className="max-w-4xl mx-auto mb-20 border-b border-[#E5E5E5] pb-8">
        <h1 className="text-3xl font-light tracking-[0.2em] mb-4">YEARLY 2025</h1>
        <p className="text-sm opacity-40 tracking-widest font-sans uppercase">The silence of writing, the clarity of mind.</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-24">
        {/* Theme Section */}
        <section className="text-center py-12">
          <h2 className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-8 flex items-center justify-center">
            <Sparkles className="w-3 h-3 mr-3" />
            Theme of the Year
          </h2>
          <div className="text-4xl font-light italic leading-relaxed">
            「余白を愉しむ、静かなる進化」
          </div>
        </section>

        {/* Goals Section */}
        <section>
          <h2 className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-12 flex items-center">
            <Target className="w-3 h-3 mr-3" />
            Core Goals
          </h2>
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex group cursor-pointer border-b border-[#F0F0F0] pb-6 hover:border-[#1A1A1A] transition-colors duration-700">
                <span className="text-[10px] opacity-20 mr-8 mt-1">0{i}</span>
                <div className="flex-grow">
                  <div className="text-xl font-light opacity-60 group-hover:opacity-100 transition-opacity duration-700 italic">
                    {i === 1 ? '日々の呼吸を整え、直感に従う' : i === 2 ? '心身の対話を最優先にする' : '創造的な沈黙の時間を持つ'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Plan Preview */}
        <section className="grid grid-cols-4 gap-8 opacity-20 hover:opacity-100 transition-opacity duration-1000">
          {[1, 2, 3, 4].map((m) => (
            <div key={m} className="border-t border-[#E5E5E5] pt-4">
              <span className="text-[10px] tracking-widest uppercase">{m}月</span>
              <div className="h-12 mt-2 bg-gradient-to-b from-[#1A1A1A]/5 to-transparent rounded-sm" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default ZenMinimalism;




