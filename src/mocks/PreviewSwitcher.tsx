import React, { useState } from 'react';
import { ZenMinimalism, BentoDashboard, EditorialJournal, Glassmorphism, AnalogCraft } from './index';

const PreviewSwitcher = () => {
  const [active, setActive] = useState('zen');

  const renderActive = () => {
    switch(active) {
      case 'zen': return <ZenMinimalism />;
      case 'bento': return <BentoDashboard />;
      case 'editorial': return <EditorialJournal />;
      case 'glass': return <Glassmorphism />;
      case 'analog': return <AnalogCraft />;
      default: return <ZenMinimalism />;
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-[100] bg-black/80 text-white p-2 rounded-lg flex gap-2 text-xs">
        <button onClick={() => setActive('zen')} className={`px-2 py-1 rounded ${active === 'zen' ? 'bg-white text-black' : ''}`}>Zen</button>
        <button onClick={() => setActive('bento')} className={`px-2 py-1 rounded ${active === 'bento' ? 'bg-white text-black' : ''}`}>Bento</button>
        <button onClick={() => setActive('editorial')} className={`px-2 py-1 rounded ${active === 'editorial' ? 'bg-white text-black' : ''}`}>Editorial</button>
        <button onClick={() => setActive('glass')} className={`px-2 py-1 rounded ${active === 'glass' ? 'bg-white text-black' : ''}`}>Glass</button>
        <button onClick={() => setActive('analog')} className={`px-2 py-1 rounded ${active === 'analog' ? 'bg-white text-black' : ''}`}>Analog</button>
      </div>
      {renderActive()}
    </div>
  );
};

export default PreviewSwitcher;




