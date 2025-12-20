import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WeeklyTask, type WeeklyEntry } from './db';
import { CheckCircle2, Circle, Plus, Trash2, Calendar as CalendarIcon, Target, ListTodo, MoreHorizontal, X } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import Calendar from './components/Calendar';

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
    <div className={`flex items-center group ${isLarge ? 'bg-cream-50/50 p-3 rounded-xl border border-transparent hover:border-paper-border/30' : ''} transition-all`}>
      <button onClick={() => onToggle(type, task.id)} className={isLarge ? "mr-4" : "mr-3"}>
        {task.completed ? 
          <CheckCircle2 className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text/60'} text-paper-text transition-transform active:scale-90`} /> : 
          <Circle className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5 text-paper-text opacity-20'} hover:opacity-40 transition-all active:scale-90`} />
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
        className={`flex-grow bg-transparent focus:outline-none py-1 transition-all ${isLarge ? 'font-medium' : 'text-sm'} ${task.completed ? 'line-through opacity-40' : 'text-paper-text'}`}
        placeholder={placeholder}
      />
      <button onClick={() => onDelete(type, task.id)} className={`opacity-0 group-hover:opacity-30 hover:!opacity-100 ml-2 transition-all p-1`}>
        <Trash2 className={`${isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-rose-500`} />
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
  const year = weekId.split('-')[0];

  const entry = useLiveQuery(() => db.weeklyEntries.get(weekId), [weekId]);
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

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 flex justify-between items-end border-b border-paper-border pb-6">
        <div>
          <h1 className="text-4xl font-serif text-paper-text italic font-bold tracking-tight">Weekly Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text opacity-60 flex items-center mt-2 font-medium hover:opacity-100 hover:bg-cream-200 px-2 py-1 rounded-lg transition-all -ml-2"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Week {weekNumber}, {year}
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} highlightMode="week" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-paper-text/20" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold">Intention for the week</h2>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              onBlur={() => {
                if (entry?.intention !== intention) {
                  saveEntry({ intention });
                }
              }}
              placeholder="今週の意図を書き込みましょう..."
              className="w-full bg-cream-100/50 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[150px] text-sm shadow-inner transition-all placeholder:italic"
            />
          </section>

          <section className="bg-cream-200/30 p-6 rounded-2xl border border-dashed border-paper-border/60">
            <h3 className="text-[10px] uppercase tracking-widest text-paper-text/40 font-bold mb-3 text-center">Focus Quote</h3>
            <p className="font-serif italic text-paper-text/70 text-center leading-relaxed">
              "The secret of getting ahead is getting started."
            </p>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white/40 p-6 rounded-2xl border border-paper-border/40 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-[0.1em] text-paper-text opacity-70 font-bold flex items-center">
                <Target className="w-4 h-4 mr-2 text-paper-text" />
                Five Most Important Tasks
              </h2>
              <button 
                onClick={() => addTask('mostImportantTasks')} 
                className="w-8 h-8 flex items-center justify-center bg-paper-text text-cream-50 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {(entry?.mostImportantTasks || []).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  type="mostImportantTasks"
                  onUpdate={updateTask}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  placeholder="最優先事項を入力..."
                  isLarge={true}
                />
              ))}
              {(!entry?.mostImportantTasks || entry.mostImportantTasks.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-paper-text/30 italic text-sm">タスクを追加して今週を始めましょう</p>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white/40 p-6 rounded-2xl border border-paper-border/40 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-paper-border/10 pb-3">
                <h2 className="text-xs uppercase tracking-[0.1em] text-paper-text opacity-60 font-bold flex items-center">
                  <ListTodo className="w-3.5 h-3.5 mr-2" />
                  Secondary Tasks
                </h2>
                <button onClick={() => addTask('secondaryTasks')} className="text-paper-text/40 hover:text-paper-text transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {(entry?.secondaryTasks || []).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    type="secondaryTasks"
                    onUpdate={updateTask}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    placeholder="重要タスク..."
                  />
                ))}
              </div>
            </section>

            <section className="bg-white/40 p-6 rounded-2xl border border-paper-border/40 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-paper-border/10 pb-3">
                <h2 className="text-xs uppercase tracking-[0.1em] text-paper-text opacity-60 font-bold flex items-center">
                  <MoreHorizontal className="w-3.5 h-3.5 mr-2" />
                  Additional Tasks
                </h2>
                <button onClick={() => addTask('additionalTasks')} className="text-paper-text/40 hover:text-paper-text transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {(entry?.additionalTasks || []).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    type="additionalTasks"
                    onUpdate={updateTask}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    placeholder="追加タスク..."
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
