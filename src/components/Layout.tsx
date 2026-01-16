import React, { useState, useEffect, useRef } from 'react';
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
  const mainContentRef = useRef<HTMLElement>(null);

  // ビューが切り替わったときにスクロールをトップに戻す
  useEffect(() => {
    if (mainContentRef.current) {
      // 少し遅延を入れて、コンテンツがレンダリングされた後にスクロール
      const timer = setTimeout(() => {
        if (mainContentRef.current) {
          mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // 初回ロード時にもスクロールをトップに戻す
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false); // 日付を選択したらモバイルでは閉じる
  };

  const navItems = [
    { id: 'yearly', icon: Layers, label: 'Yearly' },
    { id: 'monthly', icon: CalendarDays, label: 'Monthly' },
    { id: 'weekly', icon: LayoutIcon, label: 'Weekly' },
    { id: 'daily', icon: CalendarIcon, label: 'Daily' },
    { id: 'history', icon: Search, label: 'Search' },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cream-100 text-paper-text font-sans selection:bg-cream-300 overflow-hidden">
      {/* Sidebar / Navigation - Sophisticated Style */}
      <nav className="w-full md:w-20 lg:w-72 bg-cream-50/80 backdrop-blur-md border-r border-paper-border/50 flex flex-col items-center py-2 md:py-8 px-4 z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] flex-shrink-0">
        <div className="flex flex-row md:flex-col flex-grow space-x-2 md:space-x-0 md:space-y-3 w-full overflow-x-auto no-scrollbar pb-0 md:pb-0 justify-center md:justify-start">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex-grow md:flex-grow-0 flex flex-col lg:flex-row items-center justify-center lg:justify-start px-3 py-3 lg:px-5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                    ? 'bg-white text-paper-text shadow-paper'
                    : 'hover:bg-white/50 text-paper-text/60 hover:text-paper-text'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-paper-text rounded-r-full hidden lg:block animate-in slide-in-from-left duration-300" />
                )}
                <item.icon className={`w-5 h-5 md:w-5 md:h-5 lg:mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] lg:text-sm font-medium tracking-wide mt-1 lg:mt-0 transition-opacity duration-300 ${isActive ? 'opacity-100 font-semibold' : 'opacity-80'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Mobile Calendar Button */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="lg:hidden flex flex-col items-center justify-center px-3 py-3 rounded-xl transition-all duration-300 group hover:bg-white/50 text-paper-text/60 hover:text-paper-text mt-2"
          >
            <CalendarIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-[10px] font-medium tracking-wide mt-1 transition-opacity duration-300 opacity-80">Calendar</span>
          </button>

          {/* Desktop Calendar (Visible on lg screens) */}
          <div className="pt-8 mt-6 border-t border-paper-border/30 w-full hidden lg:block opacity-0 lg:opacity-100 transition-opacity duration-700 delay-100">
            <p className="px-4 text-[10px] font-bold text-paper-text/40 uppercase tracking-[0.2em] mb-4">Date Selection</p>
            <div className="scale-95 origin-top-left">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                highlightMode={currentView === 'weekly' ? 'week' : 'day'}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 md:pt-8 border-t border-paper-border/30 md:border-t-0 flex flex-row md:flex-col gap-4 items-center w-full justify-between md:justify-center hidden md:flex">
          <div className="pt-4 border-t border-paper-border/30 w-full flex justify-center hidden lg:flex">
            <button className="p-3 rounded-full hover:bg-cream-200/50 text-paper-text/60 transition-all hover:rotate-45 duration-300">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Calendar Overlay */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-paper-text/10 backdrop-blur-md lg:hidden overflow-y-auto"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div 
            className="relative w-full max-w-sm bg-white/90 rounded-[2rem] shadow-paper-deep border border-white/50 p-4 my-auto max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-2 right-2 sm:-top-12 sm:right-0 p-2 text-paper-text hover:text-paper-text/70 transition-colors bg-white/50 rounded-full backdrop-blur-sm z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              highlightMode={currentView === 'weekly' ? 'week' : currentView === 'monthly' ? 'month' : currentView === 'yearly' ? 'year' : 'day'}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto bg-cream-100 bg-[radial-gradient(#d1cebd_1px,transparent_1px)] [background-size:24px_24px] md:[background-size:32px_32px]"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-6xl mx-auto min-h-full px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
