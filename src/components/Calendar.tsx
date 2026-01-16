import React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isToday,
  isSameWeek
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  highlightMode?: 'day' | 'week' | 'month' | 'year';
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, highlightMode = 'day' }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(selectedDate));
  const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>(
    highlightMode === 'year' ? 'years' :
      highlightMode === 'month' ? 'months' : 'days'
  );

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextYear = () => setCurrentMonth(addMonths(currentMonth, 12));
  const prevYear = () => setCurrentMonth(subMonths(currentMonth, 12));

  // 選択された年を中心に、過去7年と未来7年（計15年、3x5配置）を表示するための計算
  const centerYear = currentMonth.getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => centerYear - 7 + i);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (viewMode === 'years') {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-paper-border/20 shadow-2xl">
        <header className="flex justify-between items-center mb-8 border-b border-paper-border/10 pb-4">
          <span className="font-serif italic font-bold text-paper-text/40 text-[10px] tracking-[0.2em] uppercase">
            Select Year
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 15 * 12))}
              className="p-2 hover:bg-cream-100 rounded-full transition-all text-paper-text/40 hover:text-paper-text"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 15 * 12))}
              className="p-2 hover:bg-cream-100 rounded-full transition-all text-paper-text/40 hover:text-paper-text"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
          {years.map((y, idx) => {
            const isSelected = selectedDate.getFullYear() === y;
            const isCenter = idx === 7; // 15個の真ん中
            return (
              <button
                key={y}
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(y);
                  onDateSelect(newDate);
                  setCurrentMonth(newDate);
                  if (highlightMode !== 'year') setViewMode('months');
                }}
                className={`
                  relative py-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center
                  ${isSelected
                    ? 'bg-rose-50 text-rose-900 scale-110 z-20 border border-rose-100'
                    : 'hover:bg-cream-50 text-paper-text/60 hover:text-paper-text'}
                  ${isCenter && !isSelected ? 'font-bold text-paper-text/80 ring-1 ring-paper-border/20 bg-cream-50/50' : ''}
                `}
              >
                <span className={`
                  ${isCenter ? 'text-lg' : 'text-sm'} 
                  ${isSelected ? 'font-bold' : 'font-serif italic'}
                  transition-all
                `}>
                  {y}
                </span>
                {isCenter && !isSelected && (
                  <span className="text-[8px] uppercase tracking-tighter opacity-30 absolute -bottom-1">Focus</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (viewMode === 'months') {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-paper-border/20 shadow-2xl">
        <header className="flex justify-between items-center mb-8 border-b border-paper-border/10 pb-4">
          <button
            onClick={() => setViewMode('years')}
            className="font-serif italic font-bold text-paper-text/80 hover:bg-cream-50 px-3 py-1 rounded-xl transition-all text-xl"
          >
            {format(currentMonth, 'yyyy')}
          </button>
          <div className="flex gap-1">
            <button onClick={prevYear} className="p-2 hover:bg-cream-50 rounded-full transition-colors text-paper-text/40 hover:text-paper-text">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextYear} className="p-2 hover:bg-cream-50 rounded-full transition-colors text-paper-text/40 hover:text-paper-text">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4">
          {months.map((m, i) => {
            const isSelected = selectedDate.getMonth() === i && selectedDate.getFullYear() === currentMonth.getFullYear();
            return (
              <button
                key={m}
                onClick={() => {
                  const newDate = new Date(currentMonth.getFullYear(), i, 1);
                  onDateSelect(newDate);
                  setCurrentMonth(newDate);
                  if (highlightMode !== 'month') setViewMode('days');
                }}
                className={`
                  py-5 rounded-2xl text-sm font-medium transition-all
                  ${isSelected ? 'bg-rose-50 text-rose-900 scale-105 border border-rose-100' : 'hover:bg-cream-50 text-paper-text/70'}
                `}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-paper-border/20 shadow-2xl">
      <header className="flex justify-between items-center mb-6 px-2">
        <button
          onClick={() => setViewMode('months')}
          className="font-serif italic font-bold text-paper-text/80 hover:bg-cream-50 px-3 py-1 rounded-xl transition-all text-lg"
        >
          {format(currentMonth, dateFormat, { locale: enUS })}
        </button>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-cream-50 rounded-full transition-colors text-paper-text/40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-cream-50 rounded-full transition-colors text-paper-text/40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-paper-text/40 tracking-[0.15em] py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isInSelectedWeek = highlightMode === 'week' && isSameWeek(date, selectedDate, { weekStartsOn: 1 });
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isTodayDate = isToday(date);
          const dayOfWeek = date.getDay(); // 0: Sun, 1: Mon, ...

          return (
            <div key={date.toISOString()} className="relative aspect-square flex items-center justify-center">
              {isInSelectedWeek && (
                <div className={`absolute inset-y-1 -inset-x-0.5 bg-paper-text/5 z-0
                  ${dayOfWeek === 1 ? 'rounded-l-full ml-1' : ''}
                  ${dayOfWeek === 0 ? 'rounded-r-full mr-1' : ''}
                `} />
              )}
              <button
                onClick={() => onDateSelect(date)}
                className={`
                  w-10 h-10 flex flex-col items-center justify-center text-sm transition-all relative z-10
                  ${!isCurrentMonth ? 'text-paper-text/10' : 'text-paper-text/60'}
                  ${isSelected ? 'bg-rose-100 text-rose-900 rounded-full' :
                    isInSelectedWeek ? 'text-paper-text font-bold' : 'hover:bg-cream-50 rounded-full'}
                `}
              >
                <span className={`font-medium ${isTodayDate && !isSelected ? 'text-rose-600 font-bold' : ''}`}>
                  {format(date, 'd')}
                </span>
                {isTodayDate && !isSelected && (
                  <div className="absolute bottom-1.5 w-1 h-1 bg-rose-400 rounded-full" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
