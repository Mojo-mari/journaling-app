import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type YearlyEntry, type YearlyGoal } from './db';
import { Sparkles, Target, BookOpen, Plus, Trash2, CheckCircle2, Circle, X, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import EditableField from './components/EditableField';
import Calendar from './components/Calendar';

interface YearlyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月', 
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const YearlyView: React.FC<YearlyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // 最初から5つ分の空の器を用意しておく
  const [localGoals, setLocalGoals] = useState<YearlyGoal[]>(
    Array.from({ length: 5 }).map(() => ({
      id: Math.random().toString(36).substring(2),
      text: '',
      completed: false,
      monthlyActions: {}
    }))
  );
  const [loadedYearId, setLoadedYearId] = useState<string>('');
  const yearId = selectedDate.getFullYear().toString();
  
  const entry = useLiveQuery(() => db.yearlyEntries.get(yearId), [yearId]);

  // DBのデータが変わった時、または年が変わった時にローカル状態を同期
  useEffect(() => {
    if (entry && entry.goals && entry.goals.length >= 5) {
      if (yearId !== loadedYearId) {
        setLocalGoals(JSON.parse(JSON.stringify(entry.goals)));
        setLoadedYearId(yearId);
      } else {
        // 編集中（フォーカスがある時）は外部からの同期をスキップして、入力の邪魔をしない
        if (!document.activeElement?.closest('textarea')) {
           const dbGoalsJson = JSON.stringify(entry.goals);
           const localGoalsJson = JSON.stringify(localGoals);
           if (dbGoalsJson !== localGoalsJson) {
              setLocalGoals(JSON.parse(dbGoalsJson));
           }
        }
      }
    }
  }, [entry, yearId, loadedYearId, localGoals]);

  // 目標が5つ未満の場合、自動的に補完する
  useEffect(() => {
    if (entry && entry.goals && entry.goals.length < 5) {
      const currentGoals = [...entry.goals];
      while (currentGoals.length < 5) {
        currentGoals.push({
          id: Math.random().toString(36).substring(2),
          text: '',
          completed: false,
          monthlyActions: {}
        });
      }
      db.yearlyEntries.update(yearId, { goals: currentGoals });
    } else if (entry === undefined) {
      // ローディング中
    } else if (entry === null) {
       const initialGoals = Array.from({ length: 5 }).map(() => ({
         id: Math.random().toString(36).substring(2),
         text: '',
         completed: false,
         monthlyActions: {}
       }));
       db.yearlyEntries.put({
         id: yearId,
         theme: '',
         goals: initialGoals,
         reflection: '',
         updatedAt: Date.now()
       });
    }
  }, [entry, yearId]);

  const saveEntry = async (updates: Partial<YearlyEntry>) => {
    const currentEntry = entry || {
      id: yearId,
      theme: '',
      goals: localGoals.length > 0 ? localGoals : Array.from({ length: 5 }).map(() => ({
        id: Math.random().toString(36).substring(2),
        text: '',
        completed: false,
        monthlyActions: {}
      })),
      reflection: '',
      updatedAt: Date.now(),
    };
    await db.yearlyEntries.put({ ...currentEntry, ...updates, updatedAt: Date.now() });
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  // リアルタイム表示用の関数
  const handleGoalTextChange = (index: number, text: string) => {
    setLocalGoals(prev => {
      const newGoals = [...prev];
      if (newGoals[index]) {
        newGoals[index] = { ...newGoals[index], text };
      }
      return newGoals;
    });
  };

  // DB保存用の関数（Blur時に呼ばれる）
  const handleGoalTextSave = async (index: number, text: string) => {
    const goals = [...localGoals];
    if (goals[index]) {
      goals[index].text = text;
      await saveEntry({ goals });
    }
  };

  const toggleGoal = async (index: number) => {
    setLocalGoals(prev => {
      const newGoals = [...prev];
      if (newGoals[index]) {
        const updatedGoal = { ...newGoals[index], completed: !newGoals[index].completed };
        newGoals[index] = updatedGoal;
        // 保存処理
        saveEntry({ goals: newGoals });
      }
      return newGoals;
    });
  };

  const updateMonthlyAction = async (goalIndex: number, monthIndex: number, text: string) => {
    setLocalGoals(prev => {
      const newGoals = [...prev];
      if (newGoals[goalIndex]) {
        const monthlyActions = { ...(newGoals[goalIndex].monthlyActions || {}) };
        const currentAction = monthlyActions[monthIndex + 1] || { text: '', completed: false };
        monthlyActions[monthIndex + 1] = { ...currentAction, text };
        newGoals[goalIndex] = { ...newGoals[goalIndex], monthlyActions };
        // 保存処理
        saveEntry({ goals: newGoals });
      }
      return newGoals;
    });
  };

  const toggleMonthlyAction = async (goalIndex: number, monthIndex: number) => {
    setLocalGoals(prev => {
      const newGoals = [...prev];
      if (newGoals[goalIndex]) {
        const monthlyActions = { ...(newGoals[goalIndex].monthlyActions || {}) };
        const currentAction = monthlyActions[monthIndex + 1] || { text: '', completed: false };
        monthlyActions[monthIndex + 1] = { ...currentAction, completed: !currentAction.completed };
        newGoals[goalIndex] = { ...newGoals[goalIndex], monthlyActions };
        // 保存処理
        saveEntry({ goals: newGoals });
      }
      return newGoals;
    });
  };

  const updateGoalReflection = async (index: number, reflection: string) => {
    setLocalGoals(prev => {
      const newGoals = [...prev];
      if (newGoals[index]) {
        newGoals[index] = { ...newGoals[index], reflection };
        // 保存処理
        saveEntry({ goals: newGoals });
      }
      return newGoals;
    });
  };

  return (
    <div className="p-6 md:p-10 min-h-screen pb-20">
      <header className="mb-10 border-b border-paper-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-paper-text font-bold tracking-tight">Yearly Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text opacity-60 flex items-center mt-2 font-medium text-2xl font-serif hover:opacity-100 hover:bg-cream-200 px-2 py-1 rounded-lg transition-all -ml-2"
          >
            <CalendarIcon className="w-6 h-6 mr-2" />
            {yearId}
          </button>
        </div>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="year" />
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Theme Section */}
        <section className="bg-cream-50 p-8 rounded-3xl border border-paper-border shadow-md relative overflow-hidden max-w-2xl mx-auto">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-200" />
          <h2 className="text-[12px] uppercase tracking-[0.3em] text-paper-text/50 mb-6 font-bold flex items-center justify-center">
            <Sparkles className="w-5 h-5 mr-3 text-amber-500" />
            Year's Theme
          </h2>
          <EditableField
            type="textarea"
            value={entry?.theme || ''}
            onSave={(val) => saveEntry({ theme: val })}
            placeholder="今年一年の中心となるテーマや指針を入力..."
            className="w-full bg-cream-100/30 border border-paper-border/20 rounded-2xl p-6 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[100px] text-xl font-serif shadow-inner transition-all text-center placeholder:text-paper-text/10"
          />
        </section>

        {/* 5 Specific Goals Section */}
        <section className="bg-white/40 p-8 rounded-3xl border border-paper-border/40 shadow-sm">
          <h2 className="text-sm uppercase tracking-[0.2em] text-paper-text opacity-70 font-bold flex items-center mb-8">
            <Target className="w-5 h-5 mr-3 text-paper-text" />
            5 Key Goals for the Year
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => {
              const goal = localGoals[i];
              return (
                <div key={i} className="flex flex-col bg-cream-50/50 p-5 rounded-2xl border border-paper-border/20 hover:border-paper-border/40 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-paper-text/30 uppercase tracking-widest">Goal {i + 1}</span>
                    <button onClick={() => toggleGoal(i)}>
                      {goal?.completed ? 
                        <CheckCircle2 className="w-5 h-5 text-paper-text" /> : 
                        <Circle className="w-5 h-5 text-paper-text/10 hover:text-paper-text/30" />
                      }
                    </button>
                  </div>
                  <EditableField
                    type="textarea"
                    value={goal?.text || ''}
                    onSave={(val) => handleGoalTextSave(i, val)}
                    onChange={(val) => handleGoalTextChange(i, val)} // ローカル状態のみ更新（超高速）
                    placeholder={`${i + 1}つ目の目標を入力...`}
                    className={`bg-transparent focus:outline-none text-sm font-serif font-medium min-h-[80px] leading-relaxed ${goal?.completed ? 'line-through opacity-40' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Monthly Action Plan Detail Area */}
        <section className="bg-white/40 rounded-3xl border border-paper-border/40 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-paper-border/20 bg-cream-50/30">
            <h2 className="text-sm uppercase tracking-[0.2em] text-paper-text opacity-70 font-bold flex items-center">
              <ArrowRight className="w-5 h-5 mr-3 text-paper-text" />
              Monthly Action Plan
            </h2>
            <p className="text-[11px] text-paper-text/40 mt-1 ml-8">5つの目標達成に向けた、月ごとの具体的なアクションを計画しましょう。</p>
          </div>
          
          <div className="overflow-x-auto no-scrollbar relative max-h-[600px]">
            <div className="min-w-[1200px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr className="bg-cream-50/95 backdrop-blur-sm">
                    <th className="sticky left-0 z-40 w-48 p-4 text-left border-r border-paper-border/10 text-[10px] uppercase tracking-widest text-paper-text/40 font-bold bg-cream-50">Goal</th>
                    {MONTHS.map(month => (
                      <th key={month} className="p-4 text-center border-r border-paper-border/10 text-[10px] uppercase tracking-widest text-paper-text/40 font-bold">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, goalIndex) => {
                    const goal = localGoals[goalIndex];
                    const dbGoal = entry?.goals[goalIndex];
                    return (
                      <tr key={goalIndex} className="border-t border-paper-border/10 hover:bg-cream-50/10 transition-colors">
                        <td className="sticky left-0 z-10 p-4 border-r border-paper-border/10 bg-cream-50/95 backdrop-blur-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-paper-text/30 mb-1">GOAL {goalIndex + 1}</span>
                            <span className={`text-xs font-serif font-bold text-paper-text/70 line-clamp-2 min-h-[2.5rem] ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                              {goal?.text || `(目標 ${goalIndex + 1} を未入力)`}
                            </span>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const action = dbGoal?.monthlyActions?.[monthIndex + 1];
                          const isCompleted = action && typeof action === 'object' ? action.completed : false;
                          const actionText = action && typeof action === 'object' ? action.text : (typeof action === 'string' ? action : '');
                          
                          return (
                            <td key={monthIndex} className="p-2 border-r border-paper-border/10 align-top group">
                              <div className="flex flex-col h-full">
                                <button 
                                  onClick={() => toggleMonthlyAction(goalIndex, monthIndex)}
                                  className="mb-1 self-start"
                                >
                                  {isCompleted ? 
                                    <CheckCircle2 className="w-3.5 h-3.5 text-paper-text/60" /> : 
                                    <Circle className="w-3.5 h-3.5 text-paper-text/10 hover:text-paper-text/30" />
                                  }
                                </button>
                                  <EditableField
                                    type="textarea"
                                    value={actionText}
                                    onSave={(val) => updateMonthlyAction(goalIndex, monthIndex, val)}
                                    placeholder="..."
                                    className={`w-full h-20 bg-transparent font-serif focus:bg-white/50 border-none rounded-lg p-1 text-[10px] leading-snug transition-all resize-none placeholder:text-paper-text/5 ${isCompleted ? 'line-through opacity-30' : ''}`}
                                  />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reflection Section */}
        <section className="bg-cream-50 p-8 rounded-3xl border border-paper-border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-paper-text/10" />
          <h2 className="text-[12px] uppercase tracking-[0.3em] text-paper-text/50 mb-6 font-bold flex items-center">
            <BookOpen className="w-5 h-5 mr-3" />
            Yearly Reflection
          </h2>
          <EditableField
            type="textarea"
            value={entry?.reflection || ''}
            onSave={(val) => saveEntry({ reflection: val })}
            placeholder="一年を振り返って、心に残った出来事や成長した点など..."
            className="w-full bg-cream-100/30 border border-paper-border/20 rounded-2xl p-6 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[150px] text-sm font-serif shadow-inner transition-all leading-relaxed"
          />
        </section>

        {/* Goal-Specific Reflections */}
        <section className="bg-white/40 p-8 rounded-3xl border border-paper-border/40 shadow-sm">
          <h2 className="text-sm uppercase tracking-[0.2em] text-paper-text opacity-70 font-bold flex items-center mb-8">
            <Target className="w-5 h-5 mr-3 text-paper-text" />
            Goal-Specific Reflections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => {
              const goal = localGoals[i];
              return (
                <div key={i} className="flex flex-col bg-cream-50/30 p-5 rounded-2xl border border-paper-border/10 hover:border-paper-border/30 transition-all group">
                  <div className="flex items-center justify-between mb-3 border-b border-paper-border/5 pb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 uppercase tracking-widest">Reflection {i + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${goal?.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {goal?.completed ? 'Done' : 'In Progress'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className={`text-[11px] font-serif font-bold text-paper-text/60 line-clamp-2 min-h-[2rem] ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                      {goal?.text || `(目標 ${i + 1} 未入力)`}
                    </p>
                  </div>
                  <EditableField
                    type="textarea"
                    value={goal?.reflection || ''}
                    onSave={(val) => updateGoalReflection(i, val)}
                    placeholder="この目標についての振り返りを記入..."
                    className="w-full bg-white/40 border border-paper-border/10 rounded-xl p-3 font-serif focus:outline-none focus:bg-white/80 text-xs min-h-[120px] shadow-inner transition-all"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default YearlyView;

