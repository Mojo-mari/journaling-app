import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MonthlyEntry } from './db';
import { Calendar as CalendarIcon, Target, BookOpen, Plus, Trash2, CheckCircle2, Circle, X } from 'lucide-react';
import EditableField from './components/EditableField';
import Calendar from './components/Calendar';

interface MonthlyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const monthId = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const displayMonth = selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  const entry = useLiveQuery(() => db.monthlyEntries.get(monthId), [monthId]);

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

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 border-b border-paper-border pb-6">
        <h1 className="text-4xl font-serif text-paper-text italic font-bold tracking-tight">Monthly Planning</h1>
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="text-paper-text opacity-60 flex items-center mt-2 font-medium hover:opacity-100 hover:bg-cream-200 px-2 py-1 rounded-lg transition-all -ml-2"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          {displayMonth}
        </button>
      </header>

      {/* Date Picker Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/20 backdrop-blur-sm" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative w-full max-w-sm bg-cream-100 rounded-3xl shadow-2xl border border-paper-border p-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsCalendarOpen(false)}
              className="absolute -top-12 right-0 p-2 text-cream-50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="month" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <section className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-200" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold">Month's Intention</h2>
            <EditableField
              type="textarea"
              value={entry?.intention || ''}
              onSave={(val) => saveEntry({ intention: val })}
              placeholder="今月の意図やテーマを入力..."
              className="w-full bg-cream-100/30 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[120px] text-sm shadow-inner transition-all italic"
            />
          </section>

          <section className="bg-white/40 p-6 rounded-2xl border border-paper-border/40 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-[0.1em] text-paper-text opacity-70 font-bold flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Monthly Goals
              </h2>
              <button 
                onClick={addGoal}
                className="w-8 h-8 flex items-center justify-center bg-paper-text text-cream-50 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {(entry?.goals || []).map((goal) => (
                <div key={goal.id} className="flex items-center group bg-cream-50/30 p-3 rounded-xl border border-transparent hover:border-paper-border/20 transition-all">
                  <button onClick={() => toggleGoal(goal.id)} className="mr-3">
                    {goal.completed ? 
                      <CheckCircle2 className="w-5 h-5 text-paper-text" /> : 
                      <Circle className="w-5 h-5 text-paper-text/20 hover:text-paper-text/40" />
                    }
                  </button>
                  <EditableField
                    value={goal.text}
                    onSave={(val) => updateGoal(goal.id, val)}
                    placeholder="目標を入力..."
                    className={`flex-grow bg-transparent focus:outline-none text-sm ${goal.completed ? 'line-through opacity-40' : ''}`}
                  />
                  <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 ml-2 p-1">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              ))}
              {(!entry?.goals || entry.goals.length === 0) && (
                <p className="text-center py-4 text-paper-text/30 italic text-xs">今月の目標を追加しましょう</p>
              )}
            </div>
          </section>
        </div>

        <section className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-paper-text/10" />
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Monthly Reflection
          </h2>
          <EditableField
            type="textarea"
            value={entry?.reflection || ''}
            onSave={(val) => saveEntry({ reflection: val })}
            placeholder="今月の振り返り、学んだこと、次月への課題など..."
            className="w-full bg-cream-100/30 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[400px] text-sm shadow-inner transition-all italic"
          />
        </section>
      </div>
    </div>
  );
};

export default MonthlyView;

