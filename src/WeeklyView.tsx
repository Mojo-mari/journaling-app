import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WeeklyTask, type WeeklyEntry } from './db';
import { CheckCircle2, Circle, Plus, Trash2, Calendar as CalendarIcon, Target, ListTodo, X, Layout, BookOpen, Sparkles, ArrowRight, Lock, Heart } from 'lucide-react';
import { startOfWeek, addWeeks, isSameWeek } from 'date-fns';
import Calendar from './components/Calendar';
import EditableField from './components/EditableField';
import { useSwipe } from './hooks/useSwipe';

interface TaskInputProps {
  task: WeeklyTask;
  type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks';
  onUpdate: (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string, text: string) => void;
  onToggle: (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string) => void;
  onDelete: (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string) => void;
  placeholder: string;
  isLarge?: boolean;
}

const TaskItem: React.FC<TaskInputProps> = ({ task, type, onUpdate, onToggle, onDelete, placeholder, isLarge }) => {
  return (
    <div className={`flex items-center group ${isLarge ? 'bg-white/50 p-4 rounded-xl border border-paper-border/20 shadow-sm hover:shadow-md hover:translate-y-[-1px]' : 'hover:bg-white/30 rounded-lg p-1 -ml-1'} transition-all duration-300`}>
      <button onClick={() => onToggle(type, task.id)} className={`${isLarge ? "mr-4" : "mr-3"} transition-transform active:scale-90`}>
        {task.completed ?
          <CheckCircle2 className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text/60'} text-paper-text transition-all`} /> :
          <Circle className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text opacity-20'} hover:opacity-40 transition-all`} />
        }
      </button>
      <EditableField
        value={task.text}
        onSave={(val) => onUpdate(type, task.id, val)}
        className={`flex-grow bg-transparent font-serif italic focus:outline-none py-1 transition-all ${isLarge ? 'font-medium text-lg' : 'text-sm'} ${task.completed ? 'line-through opacity-40 decoration-paper-text/30' : 'text-paper-text'} placeholder:text-paper-text/20`}
        placeholder={placeholder}
      />
      <button onClick={() => onDelete(type, task.id)} className={`opacity-0 group-hover:opacity-100 ml-3 transition-all p-1.5 hover:bg-rose-50 rounded-lg text-rose-300 hover:text-rose-500`}>
        <Trash2 className={`${isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
      </button>
    </div>
  );
};

interface WeeklyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 選択された日付から週のIDを生成 (YYYY-WW)
  const getWeekId = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-${weekNum}`;
  };

  const weekId = getWeekId(selectedDate);
  const weekNumber = weekId.split('-')[1];
  const yearId = selectedDate.getFullYear().toString();
  const monthNum = selectedDate.getMonth() + 1;

  const entry = useLiveQuery(() => db.weeklyEntries.get(weekId), [weekId]);
  const yearlyEntry = useLiveQuery(() => db.yearlyEntries.get(yearId), [yearId]);

  // 前週のエントリを取得
  const lastWeekDate = addWeeks(selectedDate, -1);
  const lastWeekId = getWeekId(lastWeekDate);
  const lastWeekEntry = useLiveQuery(() => db.weeklyEntries.get(lastWeekId), [lastWeekId]);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  const saveEntry = async (updates: Partial<WeeklyEntry>) => {
    const currentEntry = await db.weeklyEntries.get(weekId);
    const newEntry = {
      id: weekId,
      startDate: currentEntry?.startDate || startOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString(),
      intention: currentEntry?.intention || '',
      mostImportantTasks: currentEntry?.mostImportantTasks || [],
      secondaryTasks: currentEntry?.secondaryTasks || [],
      additionalTasks: currentEntry?.additionalTasks || [],
      yearlyGoalActions: currentEntry?.yearlyGoalActions || {},
      nextWeekGoals: currentEntry?.nextWeekGoals || [],
      reflection: currentEntry?.reflection || '',
      gratitude: currentEntry?.gratitude || '',
      updatedAt: Date.now(),
      ...updates
    };
    await db.weeklyEntries.put(newEntry);
  };

  const addTask = async (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks') => {
    const currentTasks = entry?.[type] || [];
    const newTask: WeeklyTask = {
      id: Math.random().toString(36).substring(2),
      text: '',
      completed: false,
      priority: type === 'mostImportantTasks' ? 'high' : type === 'secondaryTasks' ? 'medium' : 'low',
    };
    await saveEntry({ [type]: [...currentTasks, newTask] });
  };

  const updateTask = async (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string, text: string) => {
    const currentTasks = entry?.[type] || [];
    const updatedTasks = currentTasks.map(t => t.id === id ? { ...t, text } : t);
    await saveEntry({ [type]: updatedTasks });
  };

  const toggleTask = async (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string) => {
    const currentTasks = entry?.[type] || [];
    const updatedTasks = currentTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    await saveEntry({ [type]: updatedTasks });
  };

  const deleteTask = async (type: 'mostImportantTasks' | 'secondaryTasks' | 'additionalTasks', id: string) => {
    const currentTasks = entry?.[type] || [];
    const updatedTasks = currentTasks.filter(t => t.id !== id);
    await saveEntry({ [type]: updatedTasks });
  };

  // Helper to get actions for a goal as an array
  const getGoalActions = (goalIndex: number) => {
    const actions = entry?.yearlyGoalActions?.[goalIndex];
    if (Array.isArray(actions)) return actions;
    // Migrate old single-action format to array
    if (actions && typeof actions === 'object' && 'text' in actions) {
      return [{ id: 'migrated-0', text: (actions as any).text, completed: (actions as any).completed }];
    }
    return [];
  };

  const addWeeklyGoalAction = async (goalIndex: number) => {
    const currentAllActions = entry?.yearlyGoalActions || {};
    const currentGoalActions = getGoalActions(goalIndex);
    const newAction = { id: Math.random().toString(36).substring(2), text: '', completed: false };
    await saveEntry({
      yearlyGoalActions: { ...currentAllActions, [goalIndex]: [...currentGoalActions, newAction] }
    });
  };

  const updateWeeklyGoalAction = async (goalIndex: number, actionId: string, text: string) => {
    const currentAllActions = entry?.yearlyGoalActions || {};
    const currentGoalActions = getGoalActions(goalIndex);
    const updatedActions = currentGoalActions.map(a => a.id === actionId ? { ...a, text } : a);
    await saveEntry({
      yearlyGoalActions: { ...currentAllActions, [goalIndex]: updatedActions }
    });
  };

  const toggleWeeklyGoalAction = async (goalIndex: number, actionId: string) => {
    const currentAllActions = entry?.yearlyGoalActions || {};
    const currentGoalActions = getGoalActions(goalIndex);
    const updatedActions = currentGoalActions.map(a => a.id === actionId ? { ...a, completed: !a.completed } : a);
    await saveEntry({
      yearlyGoalActions: { ...currentAllActions, [goalIndex]: updatedActions }
    });
  };

  const deleteWeeklyGoalAction = async (goalIndex: number, actionId: string) => {
    const currentAllActions = entry?.yearlyGoalActions || {};
    const currentGoalActions = getGoalActions(goalIndex);
    const updatedActions = currentGoalActions.filter(a => a.id !== actionId);
    await saveEntry({
      yearlyGoalActions: { ...currentAllActions, [goalIndex]: updatedActions }
    });
  };

  const handleActionKeyDown = async (e: React.KeyboardEvent, goalIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await addWeeklyGoalAction(goalIndex);
    }
  };

  // 来週への種まきの関数
  const addNextWeekGoal = async () => {
    const currentGoals = entry?.nextWeekGoals || [];
    const newGoal: WeeklyTask = {
      id: Math.random().toString(36).substring(2),
      text: '',
      completed: false,
      priority: 'low',
    };
    await saveEntry({ nextWeekGoals: [...currentGoals, newGoal] });
  };

  const updateNextWeekGoal = async (id: string, text: string) => {
    const currentGoals = entry?.nextWeekGoals || [];
    const updatedGoals = currentGoals.map(g => g.id === id ? { ...g, text } : g);
    await saveEntry({ nextWeekGoals: updatedGoals });
  };

  const toggleNextWeekGoal = async (id: string) => {
    const currentGoals = entry?.nextWeekGoals || [];
    const updatedGoals = currentGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    await saveEntry({ nextWeekGoals: updatedGoals });
  };

  const deleteNextWeekGoal = async (id: string) => {
    const currentGoals = entry?.nextWeekGoals || [];
    const updatedGoals = currentGoals.filter(g => g.id !== id);
    await saveEntry({ nextWeekGoals: updatedGoals });
  };

  const { ref: swipeRef, isSwiping, swipeOffset, isTransitioning, flipProgress, swipeDirection } = useSwipe({
    onSwipeLeft: () => {
      const nextWeek = addWeeks(selectedDate, 1);
      onDateSelect(nextWeek);
    },
    onSwipeRight: () => {
      const prevWeek = addWeeks(selectedDate, -1);
      onDateSelect(prevWeek);
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
  const isCurrentWeek = isSameWeek(selectedDate, today, { weekStartsOn: 1 });
  const isNextWeek = isSameWeek(selectedDate, addWeeks(today, 1), { weekStartsOn: 1 });

  return (
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>} 
      className="min-h-screen pb-20"
      style={slideStyle}
    >
      <header className="mb-12 flex justify-between items-end border-b border-paper-border pb-6 relative">
        {/* Current/Next Week Badge - Top Right */}
        {(isCurrentWeek || isNextWeek) && (
          <div className="absolute -top-2 -right-2 md:top-0 md:right-0 animate-in z-20">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-paper-hover ${
              isCurrentWeek 
                ? 'bg-amber-200/70 text-amber-700 border border-amber-300/30' 
                : 'bg-amber-50/70 text-amber-600 border border-amber-200/30'
            } backdrop-blur-sm`}>
              <Sparkles className={`w-3 h-3 ${isCurrentWeek ? 'text-amber-700' : 'text-amber-600'}`} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isCurrentWeek ? '今週' : '来週'}
              </span>
            </div>
          </div>
        )}
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Weekly Planning</h1>
          <button
            onClick={() => setIsCalendarOpen(true)}
            data-no-swipe
            className={`flex items-center mt-2 font-medium hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group cursor-pointer relative z-10 ${
              isCurrentWeek 
                ? 'text-paper-text font-semibold' 
                : 'text-paper-text/60 hover:text-paper-text'
            }`}
          >
            <CalendarIcon className={`w-5 h-5 mr-2 group-hover:scale-110 transition-transform ${isCurrentWeek ? 'text-paper-text' : 'text-paper-text/40'}`} />
            {isCurrentWeek && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-paper-text/40 rounded-full animate-pulse" />
            )}
            Week {weekNumber}, {yearId}
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="week" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Yearly/Monthly Action Plan Connection */}
        <section className="bg-white/40 backdrop-blur-sm py-4 px-4 md:px-6 rounded-[1.5rem] border border-paper-border/30 shadow-paper relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-paper-text/5 transition-all duration-500 group-hover:bg-paper-text/10" />
          <div className="flex items-center mb-4">
            <div className="p-1.5 bg-white/50 rounded-lg mr-2 shadow-sm">
              <Layout className="w-3.5 h-3.5 text-paper-text/70" />
            </div>
            <h2 className="text-[10px] font-bold text-paper-text/70 tracking-widest">月間目標のための今週のアクション</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(yearlyEntry?.goals && yearlyEntry.goals.length > 0 ? yearlyEntry.goals : Array.from({ length: 3 })).map((goal, i) => {
              const yearlyGoal = goal as any; // Handle potential empty object from Array.from
              const monthlyAction = yearlyGoal?.monthlyActions?.[monthNum];
              const actionText = monthlyAction && typeof monthlyAction === 'object' ? monthlyAction.text : (typeof monthlyAction === 'string' ? monthlyAction : '');

              const weeklyActions = getGoalActions(i);

              return (
                <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:-translate-y-0.5 group/card">
                  <div className="flex flex-col mb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 uppercase tracking-widest mb-0.5">Goal {i + 1}</span>
                    <span className="text-[10px] font-serif italic font-medium text-paper-text/70 line-clamp-2 min-h-[1.5em] leading-snug" title={actionText || 'Action not set'}>
                      {actionText || <span className="text-paper-text/20">-</span>}
                    </span>
                  </div>
                  <div className="mt-auto pt-2 border-t border-paper-border/10 space-y-1">
                    {weeklyActions.length === 0 ? (
                      <div className="flex items-start gap-2">
                        <button onClick={() => addWeeklyGoalAction(i)} className="mt-0.5 transition-transform active:scale-90">
                          <Circle className="w-3.5 h-3.5 text-paper-text/20 group-hover/card:text-paper-text/40 transition-colors" />
                        </button>
                        <input
                          type="text"
                          placeholder="Action..."
                          className="text-[10px] leading-relaxed font-serif italic flex-grow bg-transparent focus:outline-none min-h-[20px] placeholder:text-paper-text/20"
                          onFocus={() => addWeeklyGoalAction(i)}
                        />
                      </div>
                    ) : (
                      weeklyActions.map((action) => (
                        <div key={action.id} className="flex items-start gap-2 group/action">
                          <button onClick={() => toggleWeeklyGoalAction(i, action.id)} className="mt-0.5 transition-transform active:scale-90">
                            {action.completed ?
                              <CheckCircle2 className="w-3.5 h-3.5 text-paper-text/60" /> :
                              <Circle className="w-3.5 h-3.5 text-paper-text/20 group-hover/card:text-paper-text/40 transition-colors" />
                            }
                          </button>
                          <input
                            type="text"
                            value={action.text}
                            onChange={(e) => updateWeeklyGoalAction(i, action.id, e.target.value)}
                            onKeyDown={(e) => handleActionKeyDown(e, i)}
                            placeholder="Action..."
                            className={`text-[10px] leading-relaxed font-serif italic flex-grow bg-transparent focus:outline-none min-h-[20px] placeholder:text-paper-text/20 ${action.completed ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                          />
                          <button
                            onClick={() => deleteWeeklyGoalAction(i, action.id)}
                            className="opacity-0 group-hover/action:opacity-100 transition-all p-0.5 hover:bg-rose-50 rounded text-rose-300 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="paper-card p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/80 transition-all duration-500" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/50 tracking-widest uppercase">今週の意図</h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>
              <EditableField
                type="textarea"
                value={entry?.intention || ''}
                onSave={(val) => saveEntry({ intention: val })}
                placeholder="今週の主な焦点や意図は何ですか？"
                className="w-full bg-white/20 border-none rounded-lg p-3 focus:ring-0 min-h-[150px] text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 resize-none leading-relaxed"
              />
            </section>

            {/* Goals from Last Week - Planning (Read-only) */}
            <section className="paper-card p-5 md:p-6 shadow-paper-hover relative overflow-hidden opacity-90">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/40 transition-all duration-500" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest uppercase">
                  <Target className="w-3.5 h-3.5 mr-2 text-amber-600/70" />
                  前週からの引き継ぎ目標
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
                {Array.isArray(lastWeekEntry?.nextWeekGoals) && lastWeekEntry.nextWeekGoals.length > 0 ? (
                  <div className="bg-slate-50/50 p-4 rounded-xl border-2 border-dashed border-slate-300/40 space-y-3 cursor-not-allowed">
                    {lastWeekEntry.nextWeekGoals.map((goal) => (
                      <div key={goal.id} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${goal.completed ? 'bg-paper-text/30 border-paper-text/30' : 'border-paper-text/20'}`} />
                        </div>
                        <span className="text-sm font-serif italic text-paper-text/50 leading-tight">{goal.text || '(Empty)'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-paper-text/20 text-[10px] font-serif italic">前週の目標はありませんでした。</p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <section className="paper-card p-5 md:p-6 shadow-paper-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest">
                  <Target className="w-3.5 h-3.5 mr-2 text-amber-600" />
                  最重要タスク
                </h2>
                <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
              </div>

              <div className="space-y-3">
                {(entry?.mostImportantTasks || []).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    type="mostImportantTasks"
                    onUpdate={updateTask}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    placeholder="最優先タスク..."
                    isLarge={true}
                  />
                ))}
                {(!entry?.mostImportantTasks || entry.mostImportantTasks.length === 0) && (
                  <div className="py-8 text-center bg-white/30 rounded-xl border border-dashed border-paper-border/30">
                    <p className="text-paper-text/30 text-xs font-serif italic">タスクを追加してください</p>
                  </div>
                )}
                <button
                  onClick={() => addTask('mostImportantTasks')}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-xl text-xs font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-4"
                >
                  <Plus className="w-4 h-4" />
                  タスクを追加
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="paper-card p-5 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
                <div className="flex justify-between items-center mb-4 border-b border-paper-border/10 pb-2">
                  <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
                    <ListTodo className="w-3 h-3 mr-2 text-amber-600" />
                    その他のタスク
                  </h2>
                  <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
                </div>
                <div className="space-y-2">
                  {(entry?.secondaryTasks || []).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="secondaryTasks"
                      onUpdate={updateTask}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      placeholder="タスク..."
                    />
                  ))}
                </div>
                <button
                  onClick={() => addTask('secondaryTasks')}
                  className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-lg text-[10px] font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  タスクを追加
                </button>
              </section>

              <section className="paper-card p-5 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
                <div className="flex justify-between items-center mb-4 border-b border-paper-border/10 pb-2">
                  <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
                    <Target className="w-3 h-3 mr-2 text-amber-600" />
                    追加タスク・メモ
                  </h2>
                  <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
                </div>
                <div className="space-y-2">
                  {(entry?.additionalTasks || []).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="additionalTasks"
                      onUpdate={updateTask}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      placeholder="目標..."
                    />
                  ))}
                  {(!entry?.additionalTasks || entry.additionalTasks.length === 0) && (
                    <p className="text-center py-4 text-paper-text/20 text-[9px] font-serif italic">独自の目標を追加してください</p>
                  )}
                </div>
                <button
                  onClick={() => addTask('additionalTasks')}
                  className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-lg text-[10px] font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  追加
                </button>
              </section>
            </div>
          </div>
        </div>

        {/* Reflection Section */}
        <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
              <BookOpen className="w-3.5 h-3.5 mr-2 text-purple-600" />
              今週の振り返り
            </h2>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.reflection || ''}
            onSave={(val) => saveEntry({ reflection: val })}
            placeholder="今週を振り返って..."
            className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[150px] resize-none leading-loose"
          />
        </section>

        {/* Gratitude Section - Reflection */}
        <section className="paper-card p-5 md:p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-200/60 transition-all duration-500 group-hover:bg-purple-200/80" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest uppercase">
              <Heart className="w-3.5 h-3.5 mr-2 text-purple-600" />
              今週の感謝
            </h2>
            <span className="text-[8px] font-bold text-purple-700 bg-purple-100/60 px-2 py-1 rounded-full tracking-widest uppercase">振り返り</span>
          </div>
          <EditableField
            type="textarea"
            value={entry?.gratitude || ''}
            onSave={(val) => saveEntry({ gratitude: val })}
            placeholder="今週に感謝していること..."
            className="w-full bg-white/30 border-none rounded-xl p-4 focus:ring-0 focus:bg-white/50 text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 min-h-[100px] resize-none leading-loose"
          />
        </section>

        {/* Next Week Goals - Planning */}
        <section className="paper-card p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-200/60 transition-all duration-500" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest uppercase">
              <ArrowRight className="w-3.5 h-3.5 mr-2 text-amber-600" />
              来週への種まき
            </h2>
            <span className="text-[8px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-full tracking-widest uppercase">計画</span>
          </div>
          <div className="space-y-2">
            {Array.isArray(entry?.nextWeekGoals) && entry.nextWeekGoals.map((goal) => (
              <div key={goal.id} className="flex items-center group bg-white/20 p-2 rounded-lg border border-transparent hover:border-paper-border/10 transition-all">
                <button onClick={() => toggleNextWeekGoal(goal.id)} className="mr-3 transition-transform active:scale-90 opacity-20">
                  {goal.completed ?
                    <CheckCircle2 className="w-4 h-4 text-paper-text" /> :
                    <Circle className="w-4 h-4 text-paper-text" />
                  }
                </button>
                <EditableField
                  value={goal.text}
                  onSave={(val) => updateNextWeekGoal(goal.id, val)}
                  placeholder="来週に向けたメモ..."
                  className={`flex-grow bg-transparent font-serif italic focus:outline-none text-sm ${goal.completed ? 'line-through opacity-40 decoration-paper-text/20' : 'text-paper-text/60'}`}
                />
                <button onClick={() => deleteNextWeekGoal(goal.id)} className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-rose-300 hover:text-rose-500 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(!entry?.nextWeekGoals || entry.nextWeekGoals.length === 0) && (
              <p className="text-center py-4 text-paper-text/20 text-[9px] font-serif italic">来週に向けたメモを追加してください</p>
            )}
            <button
              onClick={addNextWeekGoal}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-paper-text/10 text-paper-text/40 rounded-xl text-xs font-bold tracking-widest hover:border-paper-text/30 hover:text-paper-text/70 hover:bg-white/30 active:scale-[0.99] transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              来週に向けたメモを追加
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WeeklyView;
