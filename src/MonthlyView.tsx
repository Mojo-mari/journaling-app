import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MonthlyEntry } from './db';
import { Calendar as CalendarIcon, Target, BookOpen, Plus, Trash2, CheckCircle2, Circle, X, Layout } from 'lucide-react';
import EditableField from './components/EditableField';
import Calendar from './components/Calendar';

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

  const saveEntry = async (updates: Partial<MonthlyEntry>) => {
    const currentEntry = entry || {
      id: monthId,
      intention: '',
      goals: [],
      reflection: '',
      updatedAt: Date.now(),
    };
    await db.monthlyEntries.put({ ...currentEntry, ...updates, updatedAt: Date.now() });
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  const addGoal = async () => {
    const currentGoals = entry?.goals || [];
    const newGoal = {
      id: Math.random().toString(36).substring(2),
      text: '',
      completed: false,
    };
    await saveEntry({ goals: [...currentGoals, newGoal] });
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

  return (
    <div className="min-h-screen pb-20">
      <header className="mb-12 border-b border-paper-border pb-6">
        <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Monthly Planning</h1>
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="text-paper-text opacity-60 flex items-center mt-2 font-medium hover:opacity-100 hover:bg-cream-200 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group"
        >
          <CalendarIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          {displayMonth}
        </button>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="month" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Yearly Connection Section */}
        <section className="bg-white/40 backdrop-blur-sm py-4 px-4 md:px-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-paper-text/5 transition-all duration-500 group-hover:bg-paper-text/10" />
          <div className="flex items-center mb-4">
            <div className="p-1.5 bg-white/50 rounded-lg mr-2 shadow-sm">
              <Layout className="w-3.5 h-3.5 text-paper-text/70" />
            </div>
            <h2 className="text-[10px] font-bold text-paper-text/70 tracking-widest">年間計画からのアクション</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const yearlyGoal = yearlyEntry?.goals[i];
              const monthlyAction = yearlyGoal?.monthlyActions?.[monthNum];
              const isCompleted = monthlyAction && typeof monthlyAction === 'object' ? monthlyAction.completed : false;
              const actionText = monthlyAction && typeof monthlyAction === 'object' ? monthlyAction.text : (typeof monthlyAction === 'string' ? monthlyAction : '');

              return (
                <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:-translate-y-0.5 group/card">
                  <div className="flex flex-col mb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 tracking-widest mb-0.5">年間目標 {i + 1}</span>
                    <span className="text-[10px] font-serif italic font-bold text-paper-text/60 line-clamp-2 min-h-[1.5em] leading-snug">
                      {yearlyGoal?.text || `(目標 ${i + 1} 未入力)`}
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
                        placeholder="アクション..."
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
            <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200/80 transition-all duration-500 group-hover:w-1.5" />
              <h2 className="text-[10px] font-bold text-paper-text/50 mb-4 flex items-center tracking-widest">
                 <Target className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                今月の意図・テーマ
              </h2>
              <EditableField
                type="textarea"
                value={entry?.intention || ''}
                onSave={(val) => saveEntry({ intention: val })}
                placeholder="今月の意図やテーマを入力..."
                className="w-full bg-white/40 border-none rounded-xl p-4 focus:ring-0 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[100px] resize-none leading-relaxed"
              />
            </section>

            <section className="paper-card p-5 md:p-6 shadow-paper-hover">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest">
                  <Target className="w-3.5 h-3.5 mr-2 text-paper-text" />
                  その他の月間目標
                </h2>
                <button 
                  onClick={addGoal}
                  className="w-6 h-6 flex items-center justify-center bg-paper-text text-cream-50 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {(entry?.goals || []).map((goal) => (
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
                  <p className="text-center py-6 text-paper-text/30 text-[10px] font-serif italic">目標を追加</p>
                )}
              </div>
            </section>
          </div>

          <section className="paper-card p-5 md:p-6 relative overflow-hidden h-fit group">
            <div className="absolute top-0 left-0 w-1 h-full bg-paper-text/5 transition-all duration-500 group-hover:bg-paper-text/10" />
            <h2 className="text-[10px] font-bold text-paper-text/50 mb-4 flex items-center tracking-widest">
              <BookOpen className="w-3.5 h-3.5 mr-2" />
              今月の振り返り
            </h2>
            <EditableField
              type="textarea"
              value={entry?.reflection || ''}
              onSave={(val) => saveEntry({ reflection: val })}
              placeholder="今月の振り返り..."
              className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[300px] resize-none leading-loose"
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default MonthlyView;
