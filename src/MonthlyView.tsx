import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MonthlyEntry } from './db';
import { Calendar as CalendarIcon, Target, BookOpen, Plus, Trash2, CheckCircle2, Circle, X, Layout, ArrowRight, Eye, Lock, Sparkles, Heart } from 'lucide-react';
import { addMonths, isSameMonth } from 'date-fns';
import EditableField from './components/EditableField';
import Calendar from './components/Calendar';
import { useSwipe } from './hooks/useSwipe';

interface MonthlyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const yearId = selectedDate.getFullYear().toString();
  const monthNum = selectedDate.getMonth() + 1;
  const monthId = `${yearId}-${monthNum.toString().padStart(2, '0')}`;
  const displayMonth = selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  const entry = useLiveQuery(() => db.monthlyEntries.get(monthId), [monthId]);
  const yearlyEntry = useLiveQuery(() => db.yearlyEntries.get(yearId), [yearId]);

  const lastMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const lastMonthId = `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const lastMonthEntry = useLiveQuery(() => db.monthlyEntries.get(lastMonthId), [lastMonthId]);

  const saveEntry = async (updates: Partial<MonthlyEntry>) => {
    const currentEntry = await db.monthlyEntries.get(monthId);
    const newEntry = {
      id: monthId,
      intention: currentEntry?.intention || '',
      goals: currentEntry?.goals || [],
      nextMonthGoals: currentEntry?.nextMonthGoals || [],
      reflection: currentEntry?.reflection || '',
      gratitude: currentEntry?.gratitude || '',
      learning: currentEntry?.learning || '',
      updatedAt: Date.now(),
      ...updates
    };
    await db.monthlyEntries.put(newEntry);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  const addGoal = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    await db.transaction('rw', db.monthlyEntries, async () => {
      const currentEntry = await db.monthlyEntries.get(monthId);
      const currentGoals = currentEntry?.goals || [];
      const newGoal = {
        id: Math.random().toString(36).substring(2),
        text: '',
        completed: false,
      };

      const newEntryData = {
        id: monthId,
        intention: currentEntry?.intention || '',
        goals: [...currentGoals, newGoal],
        nextMonthGoals: currentEntry?.nextMonthGoals || [],
        reflection: currentEntry?.reflection || '',
        updatedAt: Date.now(),
      };

      await db.monthlyEntries.put(newEntryData);
    });
  };

  const updateGoal = async (id: string, text: string) => {
    const updatedGoals = (entry?.goals || []).map(g => g.id === id ? { ...g, text } : g);
    await saveEntry({ goals: updatedGoals });
  };

  const toggleGoal = async (id: string) => {
    const updatedGoals = (entry?.goals || []).map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    await saveEntry({ goals: updatedGoals });
  };

  const deleteGoal = async (id: string) => {
    const updatedGoals = (entry?.goals || []).map(g => g.id === id ? { ...g } : g).filter(g => g.id !== id);
    await saveEntry({ goals: updatedGoals });
  };

  const addNextMonthGoal = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    await db.transaction('rw', db.monthlyEntries, async () => {
      const currentEntry = await db.monthlyEntries.get(monthId);
      const currentGoals = currentEntry?.nextMonthGoals || [];
      const newGoal = {
        id: Math.random().toString(36).substring(2),
        text: '',
        completed: false,
      };

      const newEntryData = {
        id: monthId,
        intention: currentEntry?.intention || '',
        goals: currentEntry?.goals || [],
        nextMonthGoals: [...currentGoals, newGoal],
        reflection: currentEntry?.reflection || '',
        updatedAt: Date.now(),
      };

      await db.monthlyEntries.put(newEntryData);
    });
  };

  const updateNextMonthGoal = async (id: string, text: string) => {
    const updatedGoals = (entry?.nextMonthGoals || []).map(g => g.id === id ? { ...g, text } : g);
    await saveEntry({ nextMonthGoals: updatedGoals });
  };

  const toggleNextMonthGoal = async (id: string) => {
    const updatedGoals = (entry?.nextMonthGoals || []).map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    await saveEntry({ nextMonthGoals: updatedGoals });
  };

  const deleteNextMonthGoal = async (id: string) => {
    const updatedGoals = (entry?.nextMonthGoals || []).map(g => g.id === id ? { ...g } : g).filter(g => g.id !== id);
    await saveEntry({ nextMonthGoals: updatedGoals });
  };

  const toggleYearlyTask = async (goalIndex: number) => {
    if (!yearlyEntry) return;
    const goals = [...yearlyEntry.goals];
    if (goals[goalIndex]) {
      const monthlyActions = { ...(goals[goalIndex].monthlyActions || {}) };
      const currentAction = monthlyActions[monthNum] || { text: '', completed: false };
      monthlyActions[monthNum] = { ...currentAction, completed: !currentAction.completed };
      goals[goalIndex].monthlyActions = monthlyActions;
      await db.yearlyEntries.put({ ...yearlyEntry, goals, updatedAt: Date.now() });
    }
  };

  const updateYearlyTaskText = async (goalIndex: number, text: string) => {
    if (!yearlyEntry) return;
    const goals = [...yearlyEntry.goals];
    if (goals[goalIndex]) {
      const monthlyActions = { ...(goals[goalIndex].monthlyActions || {}) };
      const currentAction = monthlyActions[monthNum] || { text: '', completed: false };
      monthlyActions[monthNum] = { ...currentAction, text };
      goals[goalIndex].monthlyActions = monthlyActions;
      await db.yearlyEntries.put({ ...yearlyEntry, goals, updatedAt: Date.now() });
    }
  };

  const { ref: swipeRef, isSwiping, swipeOffset, isTransitioning, flipProgress, swipeDirection } = useSwipe({
    onSwipeLeft: () => {
      const nextMonth = addMonths(selectedDate, 1);
      onDateSelect(nextMonth);
    },
    onSwipeRight: () => {
      const prevMonth = addMonths(selectedDate, -1);
      onDateSelect(prevMonth);
    },
    threshold: 50
  });

  // スライド+フェードアニメーションのスタイルを計算
  const getSlideStyle = () => {
    if (!isSwiping && !isTransitioning) {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
      };
    }
    
    const direction = swipeDirection === 'left' ? -1 : swipeDirection === 'right' ? 1 : 0;
    
    if (isSwiping && direction !== 0) {
      // スワイプ中：軽くスライド + 少しフェード
      const translateX = swipeOffset * 0.5;
      const opacity = Math.max(0.7, 1 - Math.abs(swipeOffset) / 300);
      
      return {
        transform: `translateX(${translateX}px)`,
        opacity: opacity,
        willChange: 'transform, opacity'
      };
    } else if (isTransitioning) {
      // 遷移中：完全にフェードアウト
      const exitDirection = swipeDirection === 'left' ? -1 : 1;
      return {
        transform: `translateX(${exitDirection * 100}px)`,
        opacity: 0,
        transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        willChange: 'transform, opacity'
      };
    }
    
    return {
      transform: 'translateX(0)',
      opacity: 1,
      transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
  };

  const slideStyle = getSlideStyle();
  const today = new Date();
  const isCurrentMonth = isSameMonth(selectedDate, today);
  const isNextMonth = isSameMonth(selectedDate, addMonths(today, 1));

  return (
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>} 
      className="min-h-screen pb-20"
      style={slideStyle}
    >
      <header className="mb-12 border-b border-paper-border pb-6 relative">
        {/* Current/Next Month Badge - Top Right */}
        {(isCurrentMonth || isNextMonth) && (
          <div className="absolute -top-2 -right-2 md:top-0 md:right-0 animate-in z-20">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-paper-hover ${
              isCurrentMonth 
                ? 'bg-amber-200/70 text-amber-700 border border-amber-300/30' 
                : 'bg-amber-50/70 text-amber-600 border border-amber-200/30'
            } backdrop-blur-sm`}>
              <Sparkles className={`w-3 h-3 ${isCurrentMonth ? 'text-amber-700' : 'text-amber-600'}`} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isCurrentMonth ? '今月' : '来月'}
              </span>
            </div>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Monthly Planning</h1>
        <button
          onClick={() => setIsCalendarOpen(true)}
          data-no-swipe
          className={`flex items-center mt-2 font-medium hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group cursor-pointer relative z-10 ${
            isCurrentMonth 
              ? 'text-paper-text font-semibold' 
              : 'text-paper-text/60 hover:text-paper-text'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 mr-2 group-hover:scale-110 transition-transform ${isCurrentMonth ? 'text-paper-text' : 'text-paper-text/40'}`} />
          {isCurrentMonth && (
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-paper-text/40 rounded-full animate-pulse" />
          )}
          {displayMonth}
        </button>
      </header>

      {/* Date Picker Modal */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-paper-text/10 backdrop-blur-md overflow-y-auto h-fit w-full text-left"
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="month" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Theme of the Month - Planning */}
        <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-1.5" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
              <Target className="w-3.5 h-3.5 mr-2 text-amber-600" />
              今月のテーマ
            </h2>
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.intention || ''}
            onSave={(val) => saveEntry({ intention: val })}
            placeholder="今月のテーマや意図を設定..."
            className="w-full bg-white/40 border-none rounded-xl p-4 focus:ring-0 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[100px] resize-none leading-relaxed"
          />
        </section>

        {/* Goals from Last Month - Planning (Read-only) */}
        <section className="paper-card p-5 md:p-6 shadow-paper-hover relative overflow-hidden opacity-90">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/40 transition-all duration-500" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest uppercase">
              <Target className="w-3.5 h-3.5 mr-2 text-amber-600/70" />
              先月からの引き継ぎ目標
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-slate-500 bg-slate-100/60 border border-slate-300/40 px-2 py-1 rounded-full tracking-widest uppercase flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                参照のみ
              </span>
              <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(lastMonthEntry?.nextMonthGoals) && lastMonthEntry.nextMonthGoals.length > 0 ? (
              <div className="bg-slate-50/50 p-4 rounded-xl border-2 border-dashed border-slate-300/40 space-y-3 cursor-not-allowed">
                {lastMonthEntry.nextMonthGoals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${goal.completed ? 'bg-paper-text/30 border-paper-text/30' : 'border-paper-text/20'}`} />
                    </div>
                    <span className="text-sm font-serif italic text-paper-text/50 leading-tight">{goal.text || '(Empty)'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-paper-text/20 text-[10px] font-serif italic">先月の目標はありませんでした。</p>
            )}
          </div>
        </section>

        {/* Yearly Connection Section - Planning */}
        <section className="bg-white/40 backdrop-blur-sm py-4 px-4 md:px-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500 group-hover:bg-amber-200/80" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-white/50 rounded-lg mr-2 shadow-sm">
                <Layout className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-[10px] font-bold text-paper-text/70 tracking-widest">年間計画からのアクション</h2>
            </div>
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Array.isArray(yearlyEntry?.goals) && yearlyEntry.goals.length > 0 ? yearlyEntry.goals : Array.from({ length: 3 })).map((goal, i) => {
              const yearlyGoal = goal as any;
              const monthlyAction = (yearlyGoal?.monthlyActions || {})[monthNum];
              const isCompleted = monthlyAction && typeof monthlyAction === 'object' ? !!monthlyAction.completed : false;
              const actionText = monthlyAction && typeof monthlyAction === 'object' ? monthlyAction.text : (typeof monthlyAction === 'string' ? monthlyAction : '');

              return (
                <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:-translate-y-0.5 group/card">
                  <div className="flex flex-col mb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 tracking-widest mb-0.5 uppercase">Goal {i + 1}</span>
                    <span className="text-[10px] font-serif italic font-bold text-paper-text/60 line-clamp-2 min-h-[1.5em] leading-snug">
                      {yearlyGoal?.text || `(Goal ${i + 1} not set)`}
                    </span>
                  </div>
                  <div className="mt-auto pt-2 border-t border-paper-border/10 flex flex-col">
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleYearlyTask(i)} className="mt-0.5 transition-transform active:scale-90">
                        {isCompleted ?
                          <CheckCircle2 className="w-3.5 h-3.5 text-paper-text/60" /> :
                          <Circle className="w-3.5 h-3.5 text-paper-text/20 group-hover/card:text-paper-text/40 transition-colors" />
                        }
                      </button>
                      <EditableField
                        type="textarea"
                        value={actionText}
                        onSave={(val) => updateYearlyTaskText(i, val)}
                        placeholder="Action..."
                        className={`text-[10px] leading-relaxed font-serif italic flex-grow bg-transparent focus:outline-none min-h-[20px] placeholder:text-paper-text/20 ${isCompleted ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6 md:space-y-8">
            <section className="paper-card p-5 md:p-6 shadow-paper-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest uppercase">
                  <Target className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  今月の重点目標
                </h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>
              <div className="space-y-2">
                {Array.isArray(entry?.goals) && entry.goals.map((goal) => (
                  <div key={goal.id} className="flex items-center group bg-white/40 p-2 rounded-lg border border-transparent hover:border-paper-border/20 transition-all hover:bg-white/60 hover:shadow-sm">
                    <button onClick={() => toggleGoal(goal.id)} className="mr-3 transition-transform active:scale-90">
                      {goal.completed ?
                        <CheckCircle2 className="w-4 h-4 text-paper-text" /> :
                        <Circle className="w-4 h-4 text-paper-text/20 hover:text-paper-text/40 transition-colors" />
                      }
                    </button>
                    <EditableField
                      value={goal.text}
                      onSave={(val) => updateGoal(goal.id, val)}
                      placeholder="目標を入力..."
                      className={`flex-grow bg-transparent font-serif italic focus:outline-none text-sm ${goal.completed ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                    />
                    <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-rose-50 rounded-md text-rose-300 hover:text-rose-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!entry?.goals || entry.goals.length === 0) && (
                  <p className="text-center py-6 text-paper-text/30 text-[10px] font-serif italic">目標を追加してください</p>
                )}
                <button
                  onClick={addGoal}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-xl text-xs font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  目標を追加
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6 md:space-y-8">
            <section className="paper-card p-5 md:p-6 relative overflow-hidden h-fit group">
              <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
                  <BookOpen className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  今月の振り返り
                </h2>
                <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
              </div>
              <EditableField
                type="textarea"
                value={entry?.reflection || ''}
                onSave={(val) => saveEntry({ reflection: val })}
                placeholder="今月を振り返って..."
                className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[150px] resize-none leading-loose"
              />
            </section>

            {/* Gratitude Section - Reflection */}
            <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
                  <Heart className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  今月の感謝
                </h2>
                <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
              </div>
              <EditableField
                type="textarea"
                value={entry?.gratitude || ''}
                onSave={(val) => saveEntry({ gratitude: val })}
                placeholder="今月に感謝していること..."
                className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[100px] resize-none leading-loose"
              />
            </section>

            {/* Learning Section - Reflection */}
            <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
                  <Eye className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  今月の学びや成長
                </h2>
                <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
              </div>
              <EditableField
                type="textarea"
                value={entry?.learning || ''}
                onSave={(val) => saveEntry({ learning: val })}
                placeholder="今月に学んだことや成長したこと..."
                className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[100px] resize-none leading-loose"
              />
            </section>

            {/* Next Month Goals - Planning */}
            <section className="paper-card p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest uppercase">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  来月への種まき
                </h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>
              <div className="space-y-2">
                {Array.isArray(entry?.nextMonthGoals) && entry.nextMonthGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center group bg-white/20 p-2 rounded-lg border border-transparent hover:border-paper-border/10 transition-all">
                    <button onClick={() => toggleNextMonthGoal(goal.id)} className="mr-3 transition-transform active:scale-90 opacity-20">
                      {goal.completed ?
                        <CheckCircle2 className="w-4 h-4 text-paper-text" /> :
                        <Circle className="w-4 h-4 text-paper-text" />
                      }
                    </button>
                    <EditableField
                      value={goal.text}
                      onSave={(val) => updateNextMonthGoal(goal.id, val)}
                      placeholder="来月に向けたメモ..."
                      className={`flex-grow bg-transparent font-serif italic focus:outline-none text-sm ${goal.completed ? 'line-through opacity-40 decoration-paper-text/20' : 'text-paper-text/60'}`}
                    />
                    <button onClick={() => deleteNextMonthGoal(goal.id)} className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-rose-300 hover:text-rose-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!entry?.nextMonthGoals || entry.nextMonthGoals.length === 0) && (
                  <p className="text-center py-4 text-paper-text/20 text-[9px] font-serif italic">来月に向けたメモを追加してください</p>
                )}
                <button
                  onClick={addNextMonthGoal}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-xl text-xs font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  来月に向けたメモを追加
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyView;
