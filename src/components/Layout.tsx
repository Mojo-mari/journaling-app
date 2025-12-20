import React, { useState } from 'react';
import { Calendar as CalendarIcon, Layout as LayoutIcon, Settings, X, Layers, CalendarDays, Search } from 'lucide-react';
import Calendar from './Calendar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'history';
  onViewChange: (view: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'history') => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange,
  selectedDate,
  onDateSelect
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false); // 日付を選択したらモバイルでは閉じる
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream-100 text-paper-text font-sans selection:bg-cream-300">
      {/* Sidebar / Navigation */}
      <nav className="w-full md:w-20 lg:w-72 bg-cream-50 border-r border-paper-border flex flex-col items-center py-4 md:py-8 px-4 z-20">
        {/* Logo Section */}
        <div className="mb-8 md:mb-12 flex flex-row md:flex-col items-center justify-between w-full md:justify-start">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-paper-text rounded-xl flex items-center justify-center text-cream-50 shadow-lg md:mb-2">
              <LayoutIcon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <h1 className="ml-3 md:ml-0 lg:block font-serif text-xl font-bold italic tracking-tight hidden md:hidden lg:block">Journal</h1>
          </div>
          
          {/* Mobile Calendar Toggle */}
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="p-2 rounded-lg hover:bg-cream-200 text-paper-text/60 lg:hidden"
          >
            <CalendarIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-row md:flex-col flex-grow space-x-1 md:space-x-0 md:space-y-2 w-full overflow-x-auto no-scrollbar">
          <button
            onClick={() => onViewChange('daily')}
            className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-2 py-3 md:px-4 rounded-xl transition-all duration-200 group ${
              currentView === 'daily' 
                ? 'bg-cream-200 text-paper-text shadow-sm' 
                : 'hover:bg-cream-100 text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <CalendarIcon className={`w-5 h-5 md:w-6 md:h-6 lg:mr-3 ${currentView === 'daily' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0">Daily</span>
          </button>

          <button
            onClick={() => onViewChange('weekly')}
            className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-2 py-3 md:px-4 rounded-xl transition-all duration-200 group ${
              currentView === 'weekly' 
                ? 'bg-cream-200 text-paper-text shadow-sm' 
                : 'hover:bg-cream-100 text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <LayoutIcon className={`w-5 h-5 md:w-6 md:h-6 lg:mr-3 ${currentView === 'weekly' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0">Weekly</span>
          </button>

          <button
            onClick={() => onViewChange('monthly')}
            className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-2 py-3 md:px-4 rounded-xl transition-all duration-200 group ${
              currentView === 'monthly' 
                ? 'bg-cream-200 text-paper-text shadow-sm' 
                : 'hover:bg-cream-100 text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <CalendarDays className={`w-5 h-5 md:w-6 md:h-6 lg:mr-3 ${currentView === 'monthly' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0">Monthly</span>
          </button>

          <button
            onClick={() => onViewChange('yearly')}
            className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-2 py-3 md:px-4 rounded-xl transition-all duration-200 group ${
              currentView === 'yearly' 
                ? 'bg-cream-200 text-paper-text shadow-sm' 
                : 'hover:bg-cream-100 text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <Layers className={`w-5 h-5 md:w-6 md:h-6 lg:mr-3 ${currentView === 'yearly' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0">Yearly</span>
          </button>

          <button
            onClick={() => onViewChange('history')}
            className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-2 py-3 md:px-4 rounded-xl transition-all duration-200 group ${
              currentView === 'history' 
                ? 'bg-cream-200 text-paper-text shadow-sm' 
                : 'hover:bg-cream-100 text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <Search className={`w-5 h-5 md:w-6 md:h-6 lg:mr-3 ${currentView === 'history' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-[9px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0">Search</span>
          </button>
          
          {/* Desktop Calendar (Visible on lg screens) */}
          <div className="pt-8 mt-6 border-t border-paper-border/30 w-full hidden lg:block">
            <p className="px-4 text-[10px] font-bold text-paper-text/40 uppercase tracking-widest mb-4">Date Selection</p>
            <Calendar 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect} 
              highlightMode={currentView === 'weekly' ? 'week' : 'day'}
            />
          </div>
        </div>

        <div className="mt-auto pt-4 md:pt-8 border-t border-paper-border/30 md:border-t-0 flex flex-row md:flex-col gap-4 items-center w-full justify-between md:justify-center hidden md:flex">
          <div className="pt-4 border-t border-paper-border/30 w-full flex justify-center hidden lg:flex">
            <button className="p-3 rounded-full hover:bg-cream-200 text-paper-text/60 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Calendar Overlay */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/20 backdrop-blur-sm lg:hidden">
          <div className="relative w-full max-w-sm bg-cream-100 rounded-3xl shadow-2xl border border-paper-border p-2">
            <button 
              onClick={() => setIsCalendarOpen(false)}
              className="absolute -top-12 right-0 p-2 text-cream-50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <Calendar 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect} 
              highlightMode={currentView === 'weekly' ? 'week' : 'day'}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
