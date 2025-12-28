import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type YearlyEntry, type YearlyGoal } from './db';
import { Sparkles, Target, BookOpen, CheckCircle2, Circle, X, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen pb-20">
      <header className="mb-12 border-b border-paper-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Yearly Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text opacity-60 flex items-center mt-2 font-medium text-2xl font-serif italic hover:opacity-100 hover:bg-cream-200 px-3 py-1.5 rounded-full transition-all -ml-2"
          >
            <CalendarIcon className="w-6 h-6 mr-2" />
            {yearId}
          </button>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="year" />
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Theme Section */}
        <section className="bg-white/40 backdrop-blur-sm p-8 md:p-10 rounded-[2rem] border border-paper-border/30 shadow-paper relative overflow-hidden max-w-3xl mx-auto group hover:bg-white/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-3" />
          <h2 className="text-[12px] font-bold text-paper-text/50 mb-8 flex items-center justify-center tracking-widest">
            <Sparkles className="w-5 h-5 mr-3 text-amber-500" />
            今年のテーマ
          </h2>
          <EditableField
            type="textarea"
            value={entry?.theme || ''}
            onSave={(val) => saveEntry({ theme: val })}
            placeholder="今年一年の中心となるテーマや指針を入力..."
            className="w-full bg-transparent border-none rounded-2xl p-4 focus:ring-0 text-2xl md:text-3xl font-serif italic shadow-none transition-all text-center placeholder:text-paper-text/10 leading-relaxed min-h-[120px]"
          />
        </section>

        {/* 5 Specific Goals Section */}
        <section className="bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-paper-border/30 shadow-paper">
          <h2 className="text-sm font-bold text-paper-text/70 flex items-center mb-8 tracking-widest">
            <Target className="w-5 h-5 mr-3 text-paper-text" />
            年間重点目標 (5 Key Goals)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => {
              const goal = localGoals[i];
              return (
                <div key={i} className="flex flex-col bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-paper-hover hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-paper-text/30 tracking-widest bg-paper-text/5 px-2 py-1 rounded-full">Goal {i + 1}</span>
                    <button onClick={() => toggleGoal(i)} className="transition-transform active:scale-90">
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
                    className={`bg-transparent focus:outline-none text-base font-serif font-medium italic min-h-[120px] leading-relaxed resize-none ${goal?.completed ? 'line-through opacity-40' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Monthly Action Plan Detail Area */}
        <section className="bg-white/40 backdrop-blur-sm rounded-[2rem] border border-paper-border/30 shadow-paper overflow-hidden">
          <div className="p-8 border-b border-paper-border/10 bg-white/30 backdrop-blur-md">
            <h2 className="text-sm font-bold text-paper-text/70 flex items-center tracking-widest">
              <ArrowRight className="w-5 h-5 mr-3 text-paper-text" />
              月別アクションプラン
            </h2>
            <p className="text-[11px] text-paper-text/40 mt-2 ml-8 font-serif italic">5つの目標達成に向けた、月ごとの具体的なアクションを計画しましょう。</p>
          </div>
          
          <div className="overflow-x-auto no-scrollbar relative max-h-[600px]">
            <div className="min-w-[1200px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr className="bg-white/90 backdrop-blur-md border-b border-paper-border/10">
                    <th className="sticky left-0 z-40 w-56 p-4 text-left border-r border-paper-border/10 text-[10px] tracking-widest text-paper-text/40 font-bold bg-white/95 backdrop-blur-md shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]">Goal</th>
                    {MONTHS.map(month => (
                      <th key={month} className="p-4 text-center border-r border-paper-border/10 text-[10px] tracking-widest text-paper-text/40 font-bold">
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
                      <tr key={goalIndex} className="border-t border-paper-border/5 hover:bg-white/40 transition-colors group/row">
                        <td className="sticky left-0 z-10 p-5 border-r border-paper-border/10 bg-white/80 backdrop-blur-md shadow-[2px_0_10px_-5px_rgba(0,0,0,0.05)] group-hover/row:bg-white/90 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-paper-text/30 tracking-widest">GOAL {goalIndex + 1}</span>
                            <span className={`text-xs font-serif italic font-bold text-paper-text/80 line-clamp-3 min-h-[2.5rem] leading-relaxed ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                              {goal?.text || `(目標 ${goalIndex + 1} を未入力)`}
                            </span>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const action = dbGoal?.monthlyActions?.[monthIndex + 1];
                          const isCompleted = action && typeof action === 'object' ? action.completed : false;
                          const actionText = action && typeof action === 'object' ? action.text : (typeof action === 'string' ? action : '');
                          
                          return (
                            <td key={monthIndex} className="p-2 border-r border-paper-border/5 align-top group/cell min-w-[140px] hover:bg-white/50 transition-colors">
                              <div className="flex flex-col h-full p-1 rounded-lg">
                                <button 
                                  onClick={() => toggleMonthlyAction(goalIndex, monthIndex)}
                                  className="mb-1 self-start opacity-30 group-hover/cell:opacity-100 transition-opacity"
                                >
                                  {isCompleted ? 
                                    <CheckCircle2 className="w-3.5 h-3.5 text-paper-text/60" /> : 
                                    <Circle className="w-3.5 h-3.5 text-paper-text/40 hover:text-paper-text/60" />
                                  }
                                </button>
                                  <EditableField
                                    type="textarea"
                                    value={actionText}
                                    onSave={(val) => updateMonthlyAction(goalIndex, monthIndex, val)}
                                    placeholder="..."
                                    className={`w-full h-24 bg-transparent font-serif italic focus:bg-white/60 focus:shadow-sm border-none rounded-lg p-2 text-[11px] leading-relaxed transition-all resize-none placeholder:text-paper-text/5 ${isCompleted ? 'line-through opacity-30' : ''}`}
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
        <section className="bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-paper-border/30 shadow-paper relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-paper-text/5 transition-all duration-500 group-hover:bg-paper-text/10" />
          <h2 className="text-[12px] font-bold text-paper-text/50 mb-8 flex items-center justify-center tracking-widest">
            <BookOpen className="w-5 h-5 mr-3" />
            年間の振り返り
          </h2>
          <EditableField
            type="textarea"
            value={entry?.reflection || ''}
            onSave={(val) => saveEntry({ reflection: val })}
            placeholder="一年を振り返って、心に残った出来事や成長した点など..."
            className="w-full bg-white/30 border-none rounded-2xl p-6 focus:ring-0 text-base font-serif italic shadow-inner transition-all leading-loose min-h-[200px] resize-none"
          />
        </section>

        {/* Goal-Specific Reflections */}
        <section className="bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-paper-border/30 shadow-paper">
          <h2 className="text-sm font-bold text-paper-text/70 flex items-center mb-8 tracking-widest">
            <Target className="w-5 h-5 mr-3 text-paper-text" />
            目標ごとの振り返り
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => {
              const goal = localGoals[i];
              return (
                <div key={i} className="flex flex-col bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4 border-b border-paper-border/5 pb-3">
                    <span className="text-[9px] font-bold text-paper-text/30 tracking-widest">Reflection {i + 1}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${goal?.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {goal?.completed ? 'Done' : 'In Progress'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className={`text-[11px] font-serif italic font-bold text-paper-text/60 line-clamp-2 min-h-[2rem] leading-relaxed ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                      {goal?.text || `(目標 ${i + 1} 未入力)`}
                    </p>
                  </div>
                  <EditableField
                    type="textarea"
                    value={goal?.reflection || ''}
                    onSave={(val) => updateGoalReflection(i, val)}
                    placeholder="振り返り..."
                    className="w-full bg-transparent border-t border-paper-border/5 rounded-none p-2 font-serif italic focus:outline-none text-xs min-h-[120px] transition-all placeholder:italic placeholder:text-paper-text/20 leading-relaxed resize-none mt-auto"
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
