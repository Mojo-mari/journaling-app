import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WeeklyTask, type WeeklyEntry } from './db';
import { CheckCircle2, Circle, Plus, Trash2, Calendar as CalendarIcon, Target, ListTodo, X, Layout } from 'lucide-react';
import { startOfWeek } from 'date-fns';
import Calendar from './components/Calendar';
import EditableField from './components/EditableField';

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
  const [localText, setLocalText] = useState(task.text);

  useEffect(() => {
    setLocalText(task.text);
  }, [task.text]);

  return (
    <div className={`flex items-center group ${isLarge ? 'bg-white/50 p-4 rounded-xl border border-paper-border/20 shadow-sm hover:shadow-md hover:translate-y-[-1px]' : 'hover:bg-white/30 rounded-lg p-1 -ml-1'} transition-all duration-300`}>
      <button onClick={() => onToggle(type, task.id)} className={`${isLarge ? "mr-4" : "mr-3"} transition-transform active:scale-90`}>
        {task.completed ? 
          <CheckCircle2 className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text/60'} text-paper-text transition-all`} /> : 
          <Circle className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text opacity-20'} hover:opacity-40 transition-all`} />
        }
      </button>
      <input
        type="text"
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={() => {
          if (localText !== task.text) {
            onUpdate(type, task.id, localText);
          }
        }}
        className={`flex-grow bg-transparent font-serif italic focus:outline-none py-1 transition-all ${isLarge ? 'font-medium text-lg' : 'text-sm'} ${task.completed ? 'line-through opacity-40 decoration-paper-text/30' : 'text-paper-text'}`}
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
  const [intention, setIntention] = useState('');

  useEffect(() => {
    if (entry && !document.activeElement?.matches('textarea')) {
      setIntention(entry.intention);
    } else if (!entry) {
      setIntention('');
    }
  }, [entry]);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  const saveEntry = async (updates: Partial<WeeklyEntry>) => {
    const currentEntry = entry || {
      id: weekId,
      startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString(),
      intention: '',
      mostImportantTasks: [],
      secondaryTasks: [],
      additionalTasks: [],
      updatedAt: Date.now(),
    };
    await db.weeklyEntries.put({ ...currentEntry, ...updates, updatedAt: Date.now() });
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

  const updateWeeklyGoalAction = async (goalIndex: number, text: string) => {
    const currentActions = entry?.yearlyGoalActions || {};
    const currentAction = currentActions[goalIndex] || { text: '', completed: false };
    await saveEntry({
      yearlyGoalActions: { ...currentActions, [goalIndex]: { ...currentAction, text } }
    });
  };

  const toggleWeeklyGoalAction = async (goalIndex: number) => {
    const currentActions = entry?.yearlyGoalActions || {};
    const currentAction = currentActions[goalIndex] || { text: '', completed: false };
    await saveEntry({
      yearlyGoalActions: { ...currentActions, [goalIndex]: { ...currentAction, completed: !currentAction.completed } }
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="mb-12 flex justify-between items-end border-b border-paper-border pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-paper-text italic font-bold tracking-tight mb-2">Weekly Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text/60 flex items-center mt-2 font-medium hover:text-paper-text hover:bg-white/40 px-3 py-1.5 rounded-full transition-all -ml-2 font-serif italic text-xl md:text-2xl group"
          >
            <CalendarIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Week {weekNumber}, {yearId}
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
            <h2 className="text-[10px] font-bold text-paper-text/70 tracking-widest">月間目標に向けた今週のアクション</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const yearlyGoal = yearlyEntry?.goals[i];
              const monthlyAction = yearlyGoal?.monthlyActions?.[monthNum];
              const actionText = monthlyAction && typeof monthlyAction === 'object' ? monthlyAction.text : (typeof monthlyAction === 'string' ? monthlyAction : '');
              
              const weeklyActionObj = entry?.yearlyGoalActions?.[i];
              const weeklyText = typeof weeklyActionObj === 'object' ? weeklyActionObj.text : (typeof weeklyActionObj === 'string' ? weeklyActionObj : '');
              const isWeeklyCompleted = typeof weeklyActionObj === 'object' ? weeklyActionObj.completed : false;

              return (
                <div key={i} className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:-translate-y-0.5 group/card">
                  <div className="flex flex-col mb-2">
                    <span className="text-[9px] font-bold text-paper-text/30 uppercase tracking-widest mb-0.5">Goal {i + 1}</span>
                    <span className="text-[10px] font-serif italic font-medium text-paper-text/70 line-clamp-2 min-h-[1.5em] leading-snug" title={actionText || '今月のアクション未設定'}>
                      {actionText || <span className="text-paper-text/20">-</span>}
                    </span>
                  </div>
                  <div className="mt-auto pt-2 border-t border-paper-border/10">
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleWeeklyGoalAction(i)} className="mt-0.5 transition-transform active:scale-90">
                        {isWeeklyCompleted ? 
                          <CheckCircle2 className="w-3.5 h-3.5 text-paper-text/60" /> : 
                          <Circle className="w-3.5 h-3.5 text-paper-text/20 group-hover/card:text-paper-text/40 transition-colors" />
                        }
                      </button>
                      <EditableField
                        type="textarea"
                        value={weeklyText}
                        onSave={(val) => updateWeeklyGoalAction(i, val)}
                        placeholder="今週やることは？"
                        className={`text-[10px] leading-relaxed font-serif italic flex-grow bg-transparent focus:outline-none min-h-[20px] placeholder:text-paper-text/20 ${isWeeklyCompleted ? 'line-through opacity-40 decoration-paper-text/20' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="paper-card p-5 md:p-6 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-paper-text/10" />
              <h2 className="text-[10px] font-bold text-paper-text/50 mb-4 tracking-widest">今週の意図</h2>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                onBlur={() => {
                  if (entry?.intention !== intention) {
                    saveEntry({ intention });
                  }
                }}
                placeholder="今週の意図..."
                className="w-full bg-white/20 border-none rounded-lg p-3 focus:ring-0 min-h-[150px] text-sm font-serif italic shadow-inner transition-all placeholder:text-paper-text/20 resize-none leading-relaxed"
              />
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <section className="paper-card p-5 md:p-6 shadow-paper-hover">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold text-paper-text/70 flex items-center tracking-widest">
                  <Target className="w-3.5 h-3.5 mr-2 text-paper-text" />
                  今週の最優先事項
                </h2>
                <button 
                  onClick={() => addTask('mostImportantTasks')} 
                  className="w-6 h-6 flex items-center justify-center bg-paper-text text-cream-50 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
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
                    placeholder="最優先事項..."
                    isLarge={true}
                  />
                ))}
                {(!entry?.mostImportantTasks || entry.mostImportantTasks.length === 0) && (
                  <div className="py-8 text-center bg-white/30 rounded-xl border border-dashed border-paper-border/30">
                    <p className="text-paper-text/30 text-xs font-serif italic">タスクを追加</p>
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="paper-card p-5 md:p-6">
                <div className="flex justify-between items-center mb-4 border-b border-paper-border/10 pb-2">
                  <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
                    <ListTodo className="w-3 h-3 mr-2" />
                    重要タスク
                  </h2>
                  <button onClick={() => addTask('secondaryTasks')} className="text-paper-text/40 hover:text-paper-text transition-colors bg-white/50 p-1 rounded-lg hover:bg-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
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
              </section>

              <section className="paper-card p-5 md:p-6">
                <div className="flex justify-between items-center mb-4 border-b border-paper-border/10 pb-2">
                  <h2 className="text-[10px] font-bold text-paper-text/50 flex items-center tracking-widest">
                    <Target className="w-3 h-3 mr-2" />
                    その他の目標
                  </h2>
                  <button onClick={() => addTask('additionalTasks')} className="w-6 h-6 flex items-center justify-center bg-paper-text text-cream-50 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md">
                    <Plus className="w-3 h-3" />
                  </button>
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
                    <p className="text-center py-4 text-paper-text/20 text-[9px]">独自の目標を追加</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
