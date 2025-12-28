import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyEntry, type TimelineEvent, type DailyTask } from './db';
import { Calendar as CalendarIcon, Sun, Heart, CheckCircle2, Circle, Star, ListChecks, CheckSquare, Square, X, Target, Trash2 } from 'lucide-react';
import EditableField from './components/EditableField';
import Timeline from './components/Timeline';
import Calendar from './components/Calendar';

interface DailyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  
  const dateId = selectedDate.toISOString().split('T')[0];
  const dateString = selectedDate.toLocaleDateString('ja-JP', { 
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
  const habits = useLiveQuery(() => db.habits.toArray());

  // 1. Check if habits or entries are still loading
  if (habits === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="text-paper-text/40 animate-pulse text-lg font-serif tracking-widest">Loading Journal...</div>
      </div>
    );
  }

  // 2. All functions
  const saveEntry = async (updates: Partial<DailyEntry>) => {
    try {
      const currentEntry = entry || {
        id: dateId,
        date: dateId,
        gratitude: ['', '', ''],
        intention: '',
        mostImportantTask: { id: Math.random().toString(36).substring(2), text: '', completed: false },
        secondaryTasks: [
          { id: Math.random().toString(36).substring(2), text: '', completed: false },
          { id: Math.random().toString(36).substring(2), text: '', completed: false }
        ],
        additionalTasks: [
          { id: Math.random().toString(36).substring(2), text: '', completed: false },
          { id: Math.random().toString(36).substring(2), text: '', completed: false }
        ],
        habitCompletion: {},
        highlight: '',
        learning: '',
        remember: '',
        mood: 0,
        rateDay: 0,
        timeline: [],
        updatedAt: Date.now(),
      };
      await db.dailyEntries.put({ ...currentEntry, ...updates, updatedAt: Date.now() });
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const addHabit = async () => {
    if (newHabitName.trim()) {
      try {
        await db.habits.add({
          id: Math.random().toString(36).substring(2),
          name: newHabitName.trim(),
          createdAt: Date.now()
        });
        setNewHabitName('');
      } catch (error) {
        console.error('Failed to add habit:', error);
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      if (window.confirm('この習慣を削除してもよろしいですか？')) {
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
    const gratitude = [...(entry?.gratitude || ['', '', ''])];
    gratitude[index] = text;
    saveEntry({ gratitude });
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

  return (
    <div className="min-h-screen pb-20">
      <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end pb-6 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif text-paper-text italic font-bold tracking-tight mb-2 opacity-90">Daily Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text/60 flex items-center mt-2 font-medium hover:text-paper-text hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group"
          >
            <CalendarIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            {dateString}
          </button>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center px-5 py-3 bg-white/40 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 transition-all hover:shadow-paper hover:bg-white/60">
            <span className="text-[10px] font-bold text-paper-text/50 mb-2 tracking-wider">Mood</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((m) => (
                <button 
                  key={m} 
                  onClick={() => saveEntry({ mood: m })}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-paper-border-dark/50 transition-all duration-300 ${m <= (entry?.mood || 0) ? 'bg-amber-400 border-amber-500 scale-110' : 'bg-transparent hover:bg-paper-text/5'}`} 
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center px-5 py-3 bg-white/40 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 transition-all hover:shadow-paper hover:bg-white/60">
            <span className="text-[10px] font-bold text-paper-text/50 mb-2 tracking-wider">Rate Day</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button 
                  key={r} 
                  onClick={() => saveEntry({ rateDay: r })}
                  className="transition-transform active:scale-90 hover:scale-110 duration-200"
                >
                  <Star className={`w-3 h-3 md:w-4 md:h-4 ${r <= (entry?.rateDay || 0) ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-paper-text/20'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Date Picker Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-paper-text/10 backdrop-blur-md" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative w-full max-w-sm bg-white/90 rounded-[2rem] shadow-paper-deep border border-white/50 p-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsCalendarOpen(false)}
              className="absolute -top-12 right-0 p-2 text-paper-text hover:text-paper-text/70 transition-colors bg-white/50 rounded-full backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8 md:space-y-12">
          {/* Intention Section */}
          <section className="paper-card p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-1.5" />
            <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 mb-6 flex items-center tracking-widest">
              <Sun className="w-4 h-4 mr-2 text-amber-500" />
              今日のテーマ・意図
            </h2>
            <EditableField
              type="textarea"
              value={entry?.intention || ''}
              onSave={(val) => saveEntry({ intention: val })}
              placeholder="今日一日の意図や目標を入力..."
              className="w-full bg-white/40 border-none rounded-xl p-5 focus:ring-0 text-base font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[120px] resize-none leading-relaxed"
            />
          </section>

          {/* Gratitude Section */}
          <section className="paper-card p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-200/80 transition-all duration-500 group-hover:w-1.5" />
            <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 mb-6 flex items-center tracking-widest">
              <Heart className="w-4 h-4 mr-2 text-rose-400 fill-rose-400/20" />
              感謝 (Gratitude)
            </h2>
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 group/item">
                  <span className="text-paper-text/20 font-serif italic text-sm w-4 text-right transition-colors group-hover/item:text-paper-text/40">{i + 1}.</span>
                  <EditableField
                    value={entry?.gratitude?.[i] || ''}
                    onSave={(val) => updateGratitude(i, val)}
                    placeholder="感謝していることを書きましょう..."
                    className="paper-input flex-grow text-base"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Goals Summary */}
          {weeklyEntry && (
            <section className="bg-cream-200/30 p-6 md:p-8 rounded-2xl border border-dashed border-paper-border-dark/30 space-y-8 backdrop-blur-sm">
              <div>
                <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 mb-4 flex items-center tracking-widest">
                  <ListChecks className="w-3.5 h-3.5 mr-2" />
                  今週の最優先事項
                </h2>
                <div className="space-y-3 pl-2">
                  {weeklyEntry.mostImportantTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 text-sm font-serif text-paper-text/70">
                      <div className={`w-1.5 h-1.5 rounded-full ring-2 ring-paper-text/5 ${task.completed ? 'bg-paper-text/30' : 'bg-paper-text/60'}`} />
                      <span className={task.completed ? 'line-through opacity-50 decoration-paper-text/30' : ''}>{task.text || '(未入力)'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {weeklyEntry.yearlyGoalActions && Object.keys(weeklyEntry.yearlyGoalActions).length > 0 && (
                <div className="relative">
                   <div className="absolute top-0 left-0 w-full border-t border-paper-border-dark/10" />
                  <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 mb-4 flex items-center pt-6 tracking-widest">
                    <Target className="w-3.5 h-3.5 mr-2" />
                    目標に向けた今週のアクション
                  </h2>
                  <div className="space-y-3 pl-2">
                    {Object.keys(weeklyEntry.yearlyGoalActions).slice(0, 5).map((index) => {
                      const action = weeklyEntry.yearlyGoalActions?.[Number(index)];
                      if (!action) return null;
                      const actionText = typeof action === 'object' && action !== null ? action.text : '';
                      const isCompleted = typeof action === 'object' && action !== null ? action.completed : false;
                      if (!actionText) return null;
                      
                      return (
                        <div key={index} className="flex items-start gap-3 text-sm font-serif text-paper-text/70">
                           <div className={`w-1.5 h-1.5 mt-2 rounded-full ring-2 ring-paper-text/5 ${isCompleted ? 'bg-paper-text/30' : 'bg-paper-text/60'}`} />
                          <span className={`leading-relaxed ${isCompleted ? 'line-through opacity-50 decoration-paper-text/30' : ''}`}>{actionText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tasks Section */}
          <section className="space-y-8 md:space-y-12">
            {/* Habit Tracker */}
            <div className="paper-card p-6 md:p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-200/80 transition-all duration-500 group-hover:w-1.5" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 flex items-center tracking-widest">
                  <CheckSquare className="w-4 h-4 mr-2 text-teal-500" />
                  習慣トラッカー
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                {(habits || []).map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between group/habit p-2 -mx-2 hover:bg-white/50 rounded-lg transition-colors">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className="flex items-center gap-3 text-left flex-grow"
                    >
                      <div className={`transition-all duration-300 ${entry?.habitCompletion?.[habit.id] ? 'scale-110' : 'group-hover/habit:scale-105'}`}>
                         {entry?.habitCompletion?.[habit.id] ? 
                          <CheckSquare className="w-5 h-5 text-teal-600 fill-teal-50" /> : 
                          <Square className="w-5 h-5 text-paper-text/20 group-hover/habit:text-paper-text/40" />
                        }
                      </div>
                      <span className={`text-sm transition-all duration-300 ${entry?.habitCompletion?.[habit.id] ? 'text-paper-text/80 font-medium tracking-wide' : 'text-paper-text/50'}`}>
                        {habit.name}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteHabit(habit.id)}
                      className="opacity-0 group-hover/habit:opacity-100 transition-all p-1.5 hover:bg-rose-50 rounded-md text-rose-300 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!habits || habits.length === 0) && (
                  <p className="col-span-1 md:col-span-2 text-[10px] text-paper-text/30 py-4 text-center border border-dashed border-paper-border/30 rounded-xl">習慣を追加して記録を始めましょう</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2 border-t border-paper-border/10">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="新しい習慣を入力..."
                  className="flex-grow bg-white/30 border border-paper-border/30 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500/20 focus:bg-white/50 transition-all placeholder:text-paper-text/30"
                />
                <button 
                  onClick={addHabit}
                  className="bg-paper-text text-cream-50 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-[10px] md:text-xs font-bold text-paper-text/60 mb-6 px-2 tracking-widest">今日のタスク</h2>
              <div className="space-y-3">
                {(entry?.secondaryTasks || [
                  { id: 'sec-1', text: '', completed: false },
                  { id: 'sec-2', text: '', completed: false }
                ]).map((task, i) => (
                  <div key={task.id || i} className="flex items-center px-4 py-2 bg-white/30 hover:bg-white/60 rounded-xl transition-colors group">
                    <button onClick={() => toggleTask('secondaryTasks', task.id)} className="mr-4 transition-transform active:scale-90">
                      {task.completed ? 
                        <CheckCircle2 className="w-5 h-5 text-paper-text/50" /> : 
                        <Circle className="w-5 h-5 text-paper-text/20 group-hover:text-paper-text/40" />
                      }
                    </button>
                    <EditableField
                      value={task.text || ''}
                      onSave={(val) => updateTask('secondaryTasks', task.id, { text: val })}
                      placeholder="タスクを入力..."
                      className={`paper-input flex-grow text-sm ${task.completed ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Timeline Section */}
        <section className="paper-card py-8 md:py-10 px-2 md:px-4 relative overflow-hidden h-fit shadow-paper-deep">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-paper-text/5" />
          <Timeline 
            events={entry?.timeline || []} 
            onSave={handleTimelineSave} 
            selectedDate={selectedDate}
          />
        </section>
      </div>

      <footer className="mt-24 pt-12 border-t border-paper-border/10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 opacity-80 hover:opacity-100 transition-opacity">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-paper-text/50 tracking-widest">今日のハイライト</h3>
          <EditableField
            type="textarea"
            value={entry?.highlight || ''}
            onSave={(val) => saveEntry({ highlight: val })}
            className="w-full bg-white/20 border border-paper-border/20 rounded-2xl p-5 focus:outline-none focus:bg-white/40 focus:shadow-sm text-sm font-serif italic min-h-[120px] transition-all resize-none"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-paper-text/50 tracking-widest">学んだこと</h3>
          <EditableField
            type="textarea"
            value={entry?.learning || ''}
            onSave={(val) => saveEntry({ learning: val })}
            className="w-full bg-white/20 border border-paper-border/20 rounded-2xl p-5 focus:outline-none focus:bg-white/40 focus:shadow-sm text-sm font-serif italic min-h-[120px] transition-all resize-none"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-paper-text/50 tracking-widest">記憶に残したいこと</h3>
          <EditableField
            type="textarea"
            value={entry?.remember || ''}
            onSave={(val) => saveEntry({ remember: val })}
            className="w-full bg-white/20 border border-paper-border/20 rounded-2xl p-5 focus:outline-none focus:bg-white/40 focus:shadow-sm text-sm font-serif italic min-h-[120px] transition-all resize-none"
          />
        </div>
      </footer>
    </div>
  );
};

export default DailyView;
