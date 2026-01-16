import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type YearlyEntry, type YearlyGoal } from './db';
import { Sparkles, Target, BookOpen, CheckCircle2, Circle, X, Calendar as CalendarIcon, ArrowRight, Copy as CopyIcon, Plus, Trash2, PenTool, Eye } from 'lucide-react';
import { addYears, isSameYear } from 'date-fns';
import EditableField from './components/EditableField';
import Calendar from './components/Calendar';
import { useSwipe } from './hooks/useSwipe';

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
  const yearId = selectedDate.getFullYear().toString();

  // 目標を生成するヘルパー関数
  const createEmptyGoals = (count = 3, startIdx = 0): YearlyGoal[] =>
    Array.from({ length: count }).map((_, i) => ({
      id: `default-${startIdx + i}`,
      text: '',
      completed: false,
      monthlyActions: {}
    }));

  const [localGoals, setLocalGoals] = useState<YearlyGoal[]>(createEmptyGoals());
  const [loadedYearId, setLoadedYearId] = useState<string>('');

  const entry = useLiveQuery(() => db.yearlyEntries.get(yearId), [yearId]);

  // localGoalsの最新値を保持するRef
  const localGoalsRef = useRef(localGoals);
  useEffect(() => {
    localGoalsRef.current = localGoals;
  }, [localGoals]);

  // DBのデータが変わった時にローカル状態を同期
  useEffect(() => {
    if (entry === undefined) return;

    // 年度データが存在しない場合
    if (!entry) {
      if (yearId !== loadedYearId) {
        setLocalGoals(createEmptyGoals(3));
        setLoadedYearId(yearId);
      }
      return;
    }

    // データが存在する場合
    const dbGoals = (entry && entry.goals) || [];

    // 最低3つのスロットを確保（既存のIDを維持しながら不足分を補填）
    let syncedGoals = [...dbGoals];
    if (syncedGoals.length < 3) {
      const padding = createEmptyGoals(3 - syncedGoals.length, syncedGoals.length);
      syncedGoals = [...syncedGoals, ...padding];
    }

    // テストデータのクリーンアップ
    let hasTestData = false;
    const cleanGoals = syncedGoals.map((g: YearlyGoal) => {
      if (g.text && g.text.startsWith('Test Goal ')) {
        hasTestData = true;
        return { ...g, text: '' };
      }
      return g;
    });

    if (hasTestData) {
      db.yearlyEntries.put({ ...entry, goals: cleanGoals, updatedAt: Date.now() });
      setLocalGoals(cleanGoals);
      setLoadedYearId(yearId);
    } else if (yearId !== loadedYearId) {
      setLocalGoals(cleanGoals);
      setLoadedYearId(yearId);
    } else {
      // ユーザーがタイピング中でない場合のみ、DBからの最新データで上書き
      if (!document.activeElement?.closest('textarea, input')) {
        const dbGoalsJson = JSON.stringify(cleanGoals);
        const localGoalsJson = JSON.stringify(localGoalsRef.current);
        if (dbGoalsJson !== localGoalsJson) {
          setLocalGoals(cleanGoals);
        }
      }
    }
  }, [entry, yearId, loadedYearId]);

  // entryがロードされるまではローディング表示
  // ただし、localGoalsが既に初期化されている場合は、entryがundefinedでも表示を続行
  // タイムアウトを設定して、一定時間後に表示を続行する
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    if (entry !== undefined) {
      setShowContent(true);
    } else {
      // 1秒後に表示を続行（entryがundefinedでもlocalGoalsは初期化済み）
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [entry]);

  // useSwipeフックは早期リターンの前に呼ぶ必要がある（React Hooksのルール）
  const { ref: swipeRef, isSwiping, swipeOffset, isTransitioning, flipProgress, swipeDirection } = useSwipe({
    onSwipeLeft: () => {
      const nextYear = addYears(selectedDate, 1);
      onDateSelect(nextYear);
    },
    onSwipeRight: () => {
      const prevYear = addYears(selectedDate, -1);
      onDateSelect(prevYear);
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
  const isCurrentYear = isSameYear(selectedDate, today);

  // entryがnullまたはundefinedの場合は、新規エントリとして扱う（既にlocalGoalsが初期化されている）
  if (entry === undefined && !showContent) {
    return (
      <div 
        ref={swipeRef as React.RefObject<HTMLDivElement>}
        className="min-h-screen flex items-center justify-center bg-cream-100"
      >
        <div className="text-paper-text/40 animate-pulse text-lg font-serif italic tracking-widest">Loading...</div>
      </div>
    );
  }

  const saveEntry = async (updates: Partial<YearlyEntry>) => {
    const currentEntry = await db.yearlyEntries.get(yearId);
    const newEntry = {
      id: yearId,
      theme: currentEntry?.theme || '',
      goals: currentEntry?.goals || localGoalsRef.current,
      reflection: currentEntry?.reflection || '',
      updatedAt: Date.now(),
      ...updates
    };
    await db.yearlyEntries.put(newEntry);
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

  // DB保存用の関数
  const handleGoalTextSave = async (index: number, text: string) => {
    const currentGoals = [...localGoalsRef.current];
    if (currentGoals[index]) {
      currentGoals[index] = { ...currentGoals[index], text };
      await saveEntry({ goals: currentGoals });
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

  const addGoal = async () => {
    const newGoal: YearlyGoal = {
      id: Math.random().toString(36).substring(2),
      text: '',
      completed: false,
      monthlyActions: {}
    };
    const updatedGoals = [...localGoals, newGoal];
    setLocalGoals(updatedGoals);
    await saveEntry({ goals: updatedGoals });
  };

  const deleteGoal = async (index: number) => {
    // 空の目標（初期の枠）で、まだ文字が入っていない場合は確認なしでクリア
    const isSlotEmpty = !localGoals[index].text;

    if (!isSlotEmpty && !window.confirm('この目標を削除しますか？')) {
      return;
    }

    const updatedGoals = [...localGoals];
    updatedGoals.splice(index, 1);

    // 常に最低3つの「枠」を表示し続ける
    if (updatedGoals.length < 3) {
      const padding = createEmptyGoals(3 - updatedGoals.length);
      updatedGoals.push(...padding);
    }

    setLocalGoals(updatedGoals);
    await saveEntry({ goals: updatedGoals });
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
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>} 
      className="min-h-screen pb-20"
      style={slideStyle}
    >
      <header className="mb-12 border-b border-paper-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Yearly Planning</h1>
          <button
            onClick={() => setIsCalendarOpen(true)}
            data-no-swipe
            className={`flex items-center mt-2 font-medium text-2xl font-serif italic hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 group cursor-pointer relative z-10 ${
              isCurrentYear 
                ? 'text-paper-text font-semibold' 
                : 'text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <CalendarIcon className={`w-6 h-6 mr-2 group-hover:scale-110 transition-transform ${isCurrentYear ? 'text-paper-text' : 'text-paper-text/40'}`} />
            {isCurrentYear && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-paper-text/40 rounded-full animate-pulse" />
            )}
            {yearId}
          </button>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="year" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Theme Section - Planning */}
        <section className="bg-white/40 backdrop-blur-sm p-6 md:p-8 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden max-w-3xl mx-auto group hover:bg-white/50 transition-colors duration-500">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-200/80 transition-all duration-500 group-hover:w-3" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
              <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
              今年のテーマ
            </h2>
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
          </div>
          <EditableField
            type="textarea"
            value={(entry && entry.theme) || ''}
            onSave={(val) => saveEntry({ theme: val })}
            placeholder="今年一年の中心となるテーマや指針..."
            className="w-full bg-transparent border-none rounded-2xl p-2 focus:ring-0 text-lg md:text-xl font-serif italic shadow-none transition-all text-left placeholder:text-paper-text/20 placeholder:text-xs placeholder:tracking-widest placeholder:not-italic placeholder:font-bold leading-snug min-h-[3rem] resize-none overflow-y-auto"
          />
        </section>

        <section className="bg-white/40 backdrop-blur-sm p-4 md:p-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-200/60 transition-all duration-500" />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-paper-text/70 flex items-center tracking-widest">
              <Target className="w-4 h-4 mr-2 text-amber-600" />
              年間重点目標 (Key Goals)
            </h2>
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {localGoals.map((goal, i) => {
              return (
                <div key={goal.id || i} className="flex flex-col bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-white/60 shadow-sm hover:shadow-paper-hover hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-paper-text/30 tracking-widest bg-paper-text/5 px-2 py-0.5 rounded-full">Goal {i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => deleteGoal(i)}
                        className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all p-1 hover:bg-rose-50 rounded-md text-paper-text/20 hover:text-rose-400"
                        title="目標を削除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => toggleGoal(i)} className="transition-transform active:scale-90 px-0.5">
                        {goal?.completed ?
                          <CheckCircle2 className="w-3.5 h-3.5 text-paper-text" /> :
                          <Circle className="w-3.5 h-3.5 text-paper-text/10 hover:text-paper-text/30" />
                        }
                      </button>
                    </div>
                  </div>
                  <EditableField
                    type="textarea"
                    value={goal?.text || ''}
                    onSave={(val) => handleGoalTextSave(i, val)}
                    onChange={(val) => handleGoalTextChange(i, val)}
                    placeholder={`${i + 1}つ目の目標...`}
                    className={`bg-transparent focus:outline-none text-sm font-serif font-medium italic min-h-[3rem] leading-snug resize-none overflow-y-auto placeholder:text-paper-text/20 placeholder:normal-case ${goal?.completed ? 'line-through opacity-40' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Add Goal Button */}
        <button
          onClick={addGoal}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-xl text-xs font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all -mt-3"
        >
          <Plus className="w-4 h-4" />
          目標を追加
        </button>

        {/* Monthly Action Plan Detail Area - Planning */}
        <section className="bg-white/40 backdrop-blur-sm rounded-[1.5rem] border border-paper-border/30 shadow-paper overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-200/60 transition-all duration-500" />
          <div className="p-3 border-b border-paper-border/10 bg-white/30 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xs font-bold text-paper-text/70 flex items-center tracking-widest">
                  <ArrowRight className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  月別アクションプラン
                </h2>
                <p className="text-[9px] text-paper-text/40 ml-4 font-serif italic">5つの目標達成に向けた月ごとのアクション計画</p>
              </div>
              <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar relative max-h-[400px]">
            <div className="min-w-[1000px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr className="bg-white/90 backdrop-blur-md border-b border-paper-border/10">
                    <th className="sticky left-0 z-40 w-48 min-w-[180px] p-2 text-left border-r border-paper-border/10 text-[9px] tracking-widest text-paper-text/40 font-bold bg-white/95 backdrop-blur-md shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)]">Goal</th>
                    {MONTHS.map(month => (
                      <th key={month} className="p-2 text-center border-r border-paper-border/10 text-[9px] tracking-widest text-paper-text/40 font-bold">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localGoals.map((goal, goalIndex) => {
                    const dbGoal = (entry && entry.goals && entry.goals[goalIndex]) || null;
                    return (
                      <tr key={goal.id || goalIndex} className="border-t border-paper-border/5 hover:bg-white/40 transition-colors group/row">
                        <td className="sticky left-0 z-10 p-2 border-r border-paper-border/10 bg-white/80 backdrop-blur-md shadow-[2px_0_10px_-5px_rgba(0,0,0,0.05)] group-hover/row:bg-white/90 transition-colors align-top w-48 min-w-[180px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold text-paper-text/30 tracking-widest">GOAL {goalIndex + 1}</span>
                            <span className={`text-[11px] font-serif italic font-bold text-paper-text/80 line-clamp-3 min-h-[2.5rem] leading-snug ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                              {goal?.text || `(Goal ${goalIndex + 1} not set)`}
                            </span>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const action = dbGoal?.monthlyActions?.[monthIndex + 1];
                          const isCompleted = action && typeof action === 'object' ? action.completed : false;
                          const actionText = action && typeof action === 'object' ? action.text : (typeof action === 'string' ? action : '');

                          return (
                            <td key={monthIndex} className="p-1 border-r border-paper-border/5 align-top group/cell min-w-[100px] hover:bg-white/50 transition-colors">
                              <div className="flex flex-col h-full p-0.5 rounded-lg">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <button
                                    onClick={() => toggleMonthlyAction(goalIndex, monthIndex)}
                                    className="opacity-30 group-hover/cell:opacity-100 transition-opacity"
                                  >
                                    {isCompleted ?
                                      <CheckCircle2 className="w-3 h-3 text-paper-text/60" /> :
                                      <Circle className="w-3 h-3 text-paper-text/40 hover:text-paper-text/60" />
                                    }
                                  </button>
                                  {monthIndex > 0 && (
                                    <button
                                      onClick={() => {
                                        const prevAction = dbGoal?.monthlyActions?.[monthIndex];
                                        const prevText = typeof prevAction === 'object' ? prevAction?.text : (typeof prevAction === 'string' ? prevAction : '');
                                        if (prevText) {
                                          updateMonthlyAction(goalIndex, monthIndex, prevText);
                                        }
                                      }}
                                      className="opacity-0 group-hover/cell:opacity-40 hover:opacity-100 transition-opacity text-paper-text"
                                      title="前の月からコピー"
                                    >
                                      <CopyIcon className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <EditableField
                                  type="textarea"
                                  value={actionText}
                                  onSave={(val) => updateMonthlyAction(goalIndex, monthIndex, val)}
                                  placeholder="..."
                                  className={`w-full bg-transparent font-serif italic focus:bg-white/60 focus:shadow-sm border-none rounded-md p-1 text-[10px] leading-snug transition-all resize-none overflow-y-auto placeholder:text-paper-text/5 min-h-[2.5rem] ${isCompleted ? 'line-through opacity-30' : ''}`}
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
        <section className="bg-white/40 backdrop-blur-sm p-4 md:p-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
              <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
              年間の振り返り
            </h2>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.reflection || ''}
            onSave={(val) => saveEntry({ reflection: val })}
            placeholder="一年を振り返って..."
            className="w-full bg-white/30 border-none rounded-xl p-3 focus:ring-0 text-sm font-serif italic shadow-inner transition-all leading-relaxed min-h-[4rem] resize-none overflow-y-auto"
          />
        </section>

        <section className="bg-white/40 backdrop-blur-sm p-4 md:p-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-purple-200/60 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-paper-text/70 flex items-center tracking-widest">
              <Eye className="w-4 h-4 mr-2 text-purple-600" />
              目標ごとの振り返り
            </h2>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {localGoals.map((goal, i) => {
              return (
                <div key={goal.id || i} className="flex flex-col bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-2 border-b border-paper-border/5 pb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 tracking-widest uppercase">Goal {i + 1}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${goal?.completed ? 'bg-green-100/50 text-green-700' : 'bg-slate-50 border border-slate-300/60 text-slate-600'}`}>
                      {goal?.completed ? '完了' : '進行中'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className={`text-[10px] font-serif italic font-bold text-paper-text/60 line-clamp-2 min-h-[1.5rem] leading-snug ${goal?.completed ? 'line-through opacity-30' : ''}`}>
                      {goal?.text || `(Goal ${i + 1} not set)`}
                    </p>
                  </div>
                  <EditableField
                    type="textarea"
                    value={goal?.reflection || ''}
                    onSave={(val) => updateGoalReflection(i, val)}
                    placeholder="この目標を振り返って..."
                    className="w-full bg-transparent border-t border-paper-border/5 rounded-none p-1.5 font-serif italic focus:outline-none text-[10px] min-h-[3rem] transition-all placeholder:italic placeholder:text-paper-text/20 leading-relaxed resize-none overflow-y-auto mt-auto"
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
