import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyEntry, type TimelineEvent, type DailyTask } from './db';
import { Calendar as CalendarIcon, Heart, CheckCircle2, Circle, Star, ListChecks, CheckSquare, Square, X, Target, Trash2, Plus, BookOpen, Eye, Lock, Sun, Sparkles } from 'lucide-react';
import { addDays, isToday, isSameDay } from 'date-fns';
import EditableField from './components/EditableField';
import Timeline from './components/Timeline';
import Calendar from './components/Calendar';
import { useSwipe } from './hooks/useSwipe';

interface DailyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const dateId = selectedDate.toISOString().split('T')[0];
  const dateString = selectedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const getWeekId = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-${weekNum}`;
  };
  const weekId = getWeekId(selectedDate);

  const entry = useLiveQuery(() => db.dailyEntries.get(dateId), [dateId]);
  const weeklyEntry = useLiveQuery(() => db.weeklyEntries.get(weekId), [weekId]);
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray());

  // useSwipeフックは早期リターンの前に呼ぶ必要がある（React Hooksのルール）
  const { ref: swipeRef, isSwiping, swipeOffset, isTransitioning, flipProgress, swipeDirection } = useSwipe({
    onSwipeLeft: () => {
      const nextDate = addDays(selectedDate, 1);
      onDateSelect(nextDate);
    },
    onSwipeRight: () => {
      const prevDate = addDays(selectedDate, -1);
      onDateSelect(prevDate);
    },
    threshold: 50
  });

  // 1. Check if habits or entries are still loading
  if (habits === undefined) {
    return (
      <div 
        ref={swipeRef as React.RefObject<HTMLDivElement>}
        className="flex items-center justify-center min-h-screen bg-transparent"
      >
        <div className="text-paper-text/40 animate-pulse text-lg font-serif tracking-widest">Loading Journal...</div>
      </div>
    );
  }

  // 2. All functions
  const saveEntry = async (updates: Partial<DailyEntry>) => {
    try {
      const currentEntry = await db.dailyEntries.get(dateId);
      const newEntry = {
        id: dateId,
        date: dateId,
        gratitude: currentEntry?.gratitude || [''],
        intention: currentEntry?.intention || '',
        mostImportantTask: currentEntry?.mostImportantTask || { id: Math.random().toString(36).substring(2), text: '', completed: false },
        secondaryTasks: currentEntry?.secondaryTasks || [
          { id: Math.random().toString(36).substring(2), text: '', completed: false },
          { id: Math.random().toString(36).substring(2), text: '', completed: false }
        ],
        additionalTasks: currentEntry?.additionalTasks || [
          { id: Math.random().toString(36).substring(2), text: '', completed: false },
          { id: Math.random().toString(36).substring(2), text: '', completed: false }
        ],
        habitCompletion: currentEntry?.habitCompletion || {},
        highlight: currentEntry?.highlight || '',
        learning: currentEntry?.learning || '',
        remember: currentEntry?.remember || '',
        mood: currentEntry?.mood || 0,
        rateDay: currentEntry?.rateDay || 0,
        timeline: currentEntry?.timeline || [],
        updatedAt: Date.now(),
        ...updates
      };
      await db.dailyEntries.put(newEntry);
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const addHabit = async () => {
    try {
      await db.habits.add({
        id: Math.random().toString(36).substring(2),
        name: '',
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to add habit:', error);
    }
  };

  const updateHabit = async (id: string, name: string) => {
    try {
      await db.habits.update(id, { name });
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      if (window.confirm('この習慣を削除しますか？')) {
        await db.habits.delete(habitId);
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const toggleHabit = (habitId: string) => {
    const habitCompletion = { ...(entry?.habitCompletion || {}) };
    habitCompletion[habitId] = !habitCompletion[habitId];
    saveEntry({ habitCompletion });
  };

  const updateGratitude = (index: number, text: string) => {
    const gratitude = [...(entry?.gratitude || [''])];
    if (gratitude[index] !== undefined) {
      gratitude[index] = text;
      saveEntry({ gratitude });
    }
  };

  const addGratitude = () => {
    const gratitude = [...(entry?.gratitude || [''])];
    gratitude.push('');
    saveEntry({ gratitude });
  };

  const removeGratitude = (index: number) => {
    const gratitude = [...(entry?.gratitude || [''])];
    if (gratitude.length > 1) {
      gratitude.splice(index, 1);
      saveEntry({ gratitude });
    }
  };

  const updateTask = (type: 'secondaryTasks' | 'additionalTasks', id: string, updates: Partial<DailyTask>) => {
    const tasks = (entry?.[type] || []).map(t => t.id === id ? { ...t, ...updates } : t);
    saveEntry({ [type]: tasks });
  };

  const toggleTask = (type: 'secondaryTasks' | 'additionalTasks', id: string) => {
    const tasks = (entry?.[type] || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveEntry({ [type]: tasks });
  };

  const handleTimelineSave = (newTimeline: TimelineEvent[]) => {
    saveEntry({ timeline: newTimeline });
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

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
      const translateX = swipeOffset * 0.5; // スワイプ量の50%だけ移動
      const opacity = Math.max(0.7, 1 - Math.abs(swipeOffset) / 300); // 最大30%までフェード
      
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
  const isCurrentDay = isToday(selectedDate);
  const isTomorrowDay = isSameDay(selectedDate, addDays(today, 1));

  return (
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>} 
      className="min-h-screen pb-20"
      style={slideStyle}
    >
      <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end pb-6 gap-6 relative">
        {/* Today/Tomorrow Badge - Top Right */}
        {(isCurrentDay || isTomorrowDay) && (
          <div className="absolute -top-2 -right-2 md:top-0 md:right-0 animate-in z-20">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-paper-hover ${
              isCurrentDay 
                ? 'bg-amber-200/70 text-amber-700 border border-amber-300/30' 
                : 'bg-amber-50/70 text-amber-600 border border-amber-200/30'
            } backdrop-blur-sm`}>
              <Sparkles className={`w-3 h-3 ${isCurrentDay ? 'text-amber-700' : 'text-amber-600'}`} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isCurrentDay ? '今日' : '明日'}
              </span>
            </div>
          </div>
        )}
        <div>
          <h1 className="text-4xl md:text-6xl font-serif text-paper-text italic font-bold tracking-tight opacity-90 mb-2">Daily Planning</h1>
          <button
            onClick={() => setIsCalendarOpen(true)}
            data-no-swipe
            className={`flex items-center mt-2 font-medium hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group cursor-pointer relative z-10 ${
              isCurrentDay 
                ? 'text-paper-text font-semibold' 
                : 'text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <CalendarIcon className={`w-5 h-5 mr-2 group-hover:scale-110 transition-transform ${isCurrentDay ? 'text-paper-text' : 'text-paper-text/40'}`} />
            {isCurrentDay && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-paper-text/40 rounded-full animate-pulse" />
            )}
            {dateString}
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center px-3 py-2 bg-white/40 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 transition-all hover:shadow-paper hover:bg-white/60">
            <span className="text-[9px] font-bold text-paper-text/50 mb-1 tracking-wider">今日の気分</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => saveEntry({ mood: m })}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-paper-border-dark/50 transition-all duration-300 ${m <= (entry?.mood || 0) ? 'bg-amber-400 border-amber-500 scale-110' : 'bg-transparent hover:bg-paper-text/5'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center px-3 py-2 bg-white/40 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 transition-all hover:shadow-paper hover:bg-white/60">
            <span className="text-[9px] font-bold text-paper-text/50 mb-1 tracking-wider">今日の満足度</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => saveEntry({ rateDay: r })}
                  className="transition-transform active:scale-90 hover:scale-110 duration-200"
                >
                  <Star className={`w-3 h-3 md:w-3.5 md:h-3.5 ${r <= (entry?.rateDay || 0) ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-paper-text/20'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6 md:space-y-8">
          {/* Intention Section - Planning */}
          <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-1.5" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-paper-text/60 flex items-center tracking-widest uppercase">
                <Sun className="w-3.5 h-3.5 mr-2 text-amber-500" />
                今日のテーマ
              </h2>
              <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
            </div>
            <EditableField
              type="textarea"
              value={entry?.intention || ''}
              onSave={(val) => saveEntry({ intention: val })}
              placeholder="今日の意図を設定..."
              className="w-full bg-white/40 border-none rounded-xl p-3 focus:ring-0 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[80px] resize-none leading-relaxed"
            />
          </section>

          {/* Gratitude Section - Reflection */}
          <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-paper-text/60 flex items-center tracking-widest uppercase">
                <Heart className="w-3.5 h-3.5 mr-2 text-purple-600" />
                感謝
              </h2>
              <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
            </div>
            <div className="space-y-3">
              {(entry?.gratitude || ['']).map((gratitudeItem, i) => (
                <div key={i} className="flex items-center gap-3 group/item">
                  <span className="text-paper-text/20 font-serif italic text-xs w-3 text-right transition-colors group-hover/item:text-paper-text/40">{i + 1}.</span>
                  <EditableField
                    value={gratitudeItem || ''}
                    onSave={(val) => updateGratitude(i, val)}
                    placeholder="感謝していること..."
                    className="paper-input flex-grow text-sm font-serif italic"
                  />
                  {(entry?.gratitude || ['']).length > 1 && (
                    <button
                      onClick={() => removeGratitude(i)}
                      className="opacity-0 group-hover/item:opacity-100 transition-all p-1 hover:bg-rose-50 rounded-md text-rose-300 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addGratitude}
              className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-lg text-[10px] font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-3"
            >
              <Plus className="w-3.5 h-3.5" />
              感謝を追加
            </button>
          </section>

          {/* Weekly Goals Summary (Read-only) */}
          {weeklyEntry && (
            <section className="bg-slate-50/40 p-5 md:p-6 rounded-xl border-2 border-dashed border-slate-300/50 space-y-6 backdrop-blur-sm opacity-90 cursor-not-allowed">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-bold text-paper-text/60 flex items-center tracking-widest">
                  <ListChecks className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  今週の最優先事項
                </h2>
                <span className="text-[8px] font-bold text-slate-500 bg-slate-100/60 border border-slate-300/40 px-2 py-1 rounded-full tracking-widest uppercase flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  参照のみ
                </span>
              </div>
              <div className="space-y-2 pl-2">
                {weeklyEntry.mostImportantTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs font-serif italic text-paper-text/50">
                    <div className={`w-1.5 h-1.5 rounded-full ring-1 ring-paper-text/5 ${task.completed ? 'bg-paper-text/20' : 'bg-paper-text/40'}`} />
                    <span className={task.completed ? 'line-through opacity-40 decoration-paper-text/20' : ''}>{task.text || '(未入力)'}</span>
                  </div>
                ))}
              </div>

              {weeklyEntry.yearlyGoalActions && Object.keys(weeklyEntry.yearlyGoalActions).length > 0 && (
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full border-t border-slate-300/30" />
                  <div className="flex items-center justify-between mb-3 pt-4">
                    <h2 className="text-[10px] font-bold text-paper-text/60 flex items-center tracking-widest">
                      <Target className="w-3.5 h-3.5 mr-2 text-slate-500" />
                      月間目標のための今週のアクション
                    </h2>
                  </div>
                  <div className="space-y-2 pl-2">
                    {Object.keys(weeklyEntry.yearlyGoalActions || {}).map((index) => {
                      const action = weeklyEntry.yearlyGoalActions?.[Number(index)];
                      if (!action) return null;
                      const actionText = typeof action === 'object' && action !== null ? (action as any).text : '';
                      const isCompleted = typeof action === 'object' && action !== null ? (action as any).completed : false;
                      if (!actionText) return null;

                      return (
                        <div key={index} className="flex items-start gap-2 text-xs font-serif italic text-paper-text/50">
                          <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ring-1 ring-paper-text/5 ${isCompleted ? 'bg-paper-text/20' : 'bg-paper-text/40'}`} />
                          <span className={`leading-relaxed ${isCompleted ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}>{actionText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tasks Section */}
          <section className="space-y-6 md:space-y-8">
            {/* Habit Tracker - Planning */}
            <div className="paper-card p-5 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-1.5" />
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/60 flex items-center tracking-widest uppercase">
                  <CheckSquare className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  習慣トラッカー
                </h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-6">
                {(habits || []).map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between group/habit p-1.5 -mx-1.5 hover:bg-white/50 rounded-lg transition-colors">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      <div className={`transition-all duration-300 ${entry?.habitCompletion?.[habit.id] ? 'scale-110' : 'group-hover/habit:scale-105'}`}>
                        {entry?.habitCompletion?.[habit.id] ?
                          <CheckSquare className="w-4 h-4 text-teal-600 fill-teal-50" /> :
                          <Square className="w-4 h-4 text-paper-text/20 group-hover/habit:text-paper-text/40" />
                        }
                      </div>
                    </button>
                    <div className="flex-grow">
                      <EditableField
                        value={habit.name}
                        onSave={(val) => updateHabit(habit.id, val)}
                        placeholder="習慣..."
                        className={`text-xs font-serif italic transition-all duration-300 w-full bg-transparent focus:outline-none text-paper-text ${entry?.habitCompletion?.[habit.id] ? 'font-medium tracking-wide opacity-70' : ''}`}
                      />
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="opacity-0 group-hover/habit:opacity-100 transition-all p-1 hover:bg-rose-50 rounded-md text-rose-300 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!habits || habits.length === 0) && (
                  <p className="col-span-1 md:col-span-2 text-[10px] text-paper-text/30 py-3 text-center border border-dashed border-paper-border/30 rounded-lg font-serif italic">習慣を追加してください</p>
                )}
              </div>
              <button
                onClick={addHabit}
                className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-lg text-[10px] font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                習慣を追加
              </button>
            </div>

            <div className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[10px] font-bold text-paper-text/60 tracking-widest uppercase">その他のタスク</h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>
              <div className="space-y-2">
                {(entry?.secondaryTasks || [
                  { id: 'sec-1', text: '', completed: false },
                  { id: 'sec-2', text: '', completed: false }
                ]).map((task, i) => (
                  <div key={task.id || i} className="flex items-center px-3 py-1.5 bg-white/30 hover:bg-white/60 rounded-lg transition-colors group">
                    <button onClick={() => toggleTask('secondaryTasks', task.id)} className="mr-3 transition-transform active:scale-90">
                      {task.completed ?
                        <CheckCircle2 className="w-4 h-4 text-paper-text/50" /> :
                        <Circle className="w-4 h-4 text-paper-text/20 group-hover:text-paper-text/40" />
                      }
                    </button>
                    <EditableField
                      value={task.text || ''}
                      onSave={(val) => updateTask('secondaryTasks', task.id, { text: val })}
                      placeholder="タスク..."
                      className={`paper-input flex-grow text-sm font-serif italic ${task.completed ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => updateTask('secondaryTasks', Math.random().toString(36).substring(2), { text: '', completed: false })}
                className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-lg text-[10px] font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-3"
              >
                <Plus className="w-3.5 h-3.5" />
                タスクを追加
              </button>
            </div>
          </section>
        </div>

        {/* Timeline Section - Reflection */}
        <section className="paper-card py-6 md:py-8 px-2 md:px-4 relative overflow-hidden h-fit shadow-paper-deep">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-200/60 transition-all duration-500" />
          <Timeline
            events={entry?.timeline || []}
            onSave={handleTimelineSave}
            selectedDate={selectedDate}
          />
        </section>
      </div>

      <footer className="mt-16 pt-8 border-t border-paper-border/10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 opacity-80 hover:opacity-100 transition-opacity">
        <div className="space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-paper-text/50 tracking-widest uppercase flex items-center">
              <BookOpen className="w-3 h-3 mr-2 text-purple-600" />
              学び・発見
            </h3>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.learning || ''}
            onSave={(val) => saveEntry({ learning: val })}
            className="w-full bg-white/20 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:bg-white/40 focus:shadow-sm text-sm font-serif italic min-h-[80px] transition-all resize-none"
          />
        </div>
        <div className="space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-paper-text/50 tracking-widest uppercase flex items-center">
              <Eye className="w-3 h-3 mr-2 text-purple-600" />
              覚えておきたいこと
            </h3>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.remember || ''}
            onSave={(val) => saveEntry({ remember: val })}
            className="w-full bg-white/20 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:bg-white/40 focus:shadow-sm text-sm font-serif italic min-h-[80px] transition-all resize-none"
          />
        </div>
      </footer>
    </div>
  );
};

export default DailyView;
