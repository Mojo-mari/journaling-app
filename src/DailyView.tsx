import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyEntry, type TimelineEvent, type DailyTask } from './db';
import { Calendar as CalendarIcon, Sun, Heart, CheckCircle2, Circle, Star, ListChecks, CheckSquare, Square, Plus, X } from 'lucide-react';
import EditableField from './components/EditableField';
import Timeline from './components/Timeline';
import Calendar from './components/Calendar';

interface DailyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ selectedDate, onDateSelect }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

  // 習慣データの読み込み完了を待つ（entryは存在しない場合もあるのでhabitsで判定）
  if (habits === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-100">
        <div className="text-paper-text/40 animate-pulse font-serif italic text-lg">Loading Journal...</div>
      </div>
    );
  }

  const saveEntry = async (updates: Partial<DailyEntry>) => {
    const currentEntry = entry || {
      id: dateId,
      date: dateId,
      gratitude: ['', '', ''],
      intention: '',
      mostImportantTask: { id: Math.random().toString(36).substring(2), text: '', completed: false, sessions: 0 },
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
  };

  const addHabit = async () => {
    const name = prompt('新しい習慣の名前を入力してください:');
    if (name) {
      await db.habits.add({
        id: Math.random().toString(36).substring(2),
        name,
        createdAt: Date.now()
      });
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

  const updateTask = (type: 'mostImportantTask' | 'secondaryTasks' | 'additionalTasks', id: string, updates: Partial<DailyTask>) => {
    if (type === 'mostImportantTask') {
      saveEntry({ mostImportantTask: { ...(entry?.mostImportantTask || {}), ...updates } as DailyTask });
    } else {
      const tasks = (entry?.[type] || []).map(t => t.id === id ? { ...t, ...updates } : t);
      saveEntry({ [type]: tasks });
    }
  };

  const toggleTask = (type: 'mostImportantTask' | 'secondaryTasks' | 'additionalTasks', id: string) => {
    if (type === 'mostImportantTask') {
      const task = entry?.mostImportantTask;
      if (task) {
        saveEntry({ mostImportantTask: { ...task, completed: !task.completed } });
      }
    } else {
      const tasks = (entry?.[type] || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      saveEntry({ [type]: tasks });
    }
  };

  const updateSessions = (count: number) => {
    if (entry?.mostImportantTask) {
      saveEntry({ mostImportantTask: { ...entry.mostImportantTask, sessions: count } });
    }
  };

  const handleTimelineSave = (newTimeline: TimelineEvent[]) => {
    saveEntry({ timeline: newTimeline });
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end border-b border-paper-border pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-paper-text italic font-bold tracking-tight">Daily Planning</h1>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="text-paper-text opacity-60 flex items-center mt-2 font-medium hover:opacity-100 hover:bg-cream-200 px-2 py-1 rounded-lg transition-all -ml-2"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {dateString}
          </button>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center px-4 py-2 bg-cream-50 rounded-lg border border-paper-border shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-paper-text/40 font-bold mb-1">Mood</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((m) => (
                <button 
                  key={m} 
                  onClick={() => saveEntry({ mood: m })}
                  className={`w-4 h-4 rounded-full border border-paper-border/50 transition-colors ${m <= (entry?.mood || 0) ? 'bg-amber-400' : 'bg-transparent'}`} 
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center px-4 py-2 bg-cream-50 rounded-lg border border-paper-border shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-paper-text/40 font-bold mb-1">Rate Day</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <button 
                  key={r} 
                  onClick={() => saveEntry({ rateDay: r })}
                  className="transition-transform active:scale-90"
                >
                  <Star className={`w-4 h-4 ${r <= (entry?.rateDay || 0) ? 'fill-amber-400 text-amber-400' : 'text-paper-text/20'}`} />
                </button>
              ))}
            </div>
          </div>
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
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          {/* Gratitude Section */}
          <section className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-200" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold flex items-center">
              <Heart className="w-4 h-4 mr-2 text-rose-400 fill-rose-400/20" />
              Gratitude
            </h2>
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-paper-text/30 font-serif italic text-sm">{i + 1}.</span>
                  <EditableField
                    value={entry?.gratitude?.[i] || ''}
                    onSave={(val) => updateGratitude(i, val)}
                    placeholder="感謝していることを書きましょう..."
                    className="flex-grow bg-transparent border-b border-paper-border/20 focus:border-paper-border focus:outline-none py-1 text-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Intention Section */}
          <section className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-200" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold flex items-center">
              <Sun className="w-4 h-4 mr-2 text-amber-500" />
              Intention for the Day
            </h2>
            <EditableField
              type="textarea"
              value={entry?.intention || ''}
              onSave={(val) => saveEntry({ intention: val })}
              placeholder="今日一日の意図や目標を入力..."
              className="w-full bg-cream-100/30 border border-paper-border/20 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/50 min-h-[100px] text-sm shadow-inner transition-all placeholder:italic"
            />
          </section>

          {/* Weekly Goals Summary */}
          {weeklyEntry && (
            <section className="bg-cream-200/20 p-6 rounded-2xl border border-dashed border-paper-border/40">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-paper-text/40 mb-4 font-bold flex items-center">
                <ListChecks className="w-3.5 h-3.5 mr-2" />
                Weekly Focus
              </h2>
              <div className="space-y-2">
                {weeklyEntry.mostImportantTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs text-paper-text/60 italic">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.completed ? 'bg-paper-text/20' : 'bg-paper-text/40'}`} />
                    <span className={task.completed ? 'line-through opacity-50' : ''}>{task.text || '(未入力)'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tasks Section */}
          <section className="space-y-10">
            {/* Habit Tracker */}
            <div className="bg-cream-50 p-6 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-200" />
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 font-bold flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-teal-500" />
                  Habit Tracker
                </h2>
                <button onClick={addHabit} className="text-paper-text/30 hover:text-paper-text transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {(habits || []).map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="flex items-center gap-3 group text-left"
                  >
                    {entry?.habitCompletion?.[habit.id] ? 
                      <CheckSquare className="w-4 h-4 text-teal-600 fill-teal-50" /> : 
                      <Square className="w-4 h-4 text-paper-text/20 group-hover:text-paper-text/40" />
                    }
                    <span className={`text-sm ${entry?.habitCompletion?.[habit.id] ? 'text-paper-text/80 font-medium' : 'text-paper-text/40'}`}>
                      {habit.name}
                    </span>
                  </button>
                ))}
                {(!habits || habits.length === 0) && (
                  <p className="col-span-2 text-[10px] italic text-paper-text/20 py-2">習慣を追加して記録を始めましょう</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 font-bold">The One Most Important Task</h2>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-paper-text/30">
                  <div className="flex items-center gap-1.5">
                    <span>Target:</span>
                    <EditableField
                      value={entry?.mostImportantTask?.targetTime || ''}
                      onSave={(val) => updateTask('mostImportantTask', entry?.mostImportantTask?.id || '', { targetTime: val })}
                      placeholder="0.0"
                      className="w-8 bg-transparent border-b border-paper-border/20 focus:outline-none text-center"
                    />
                    <span>h</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-paper-text/50">
                    <span>Actual:</span>
                    <EditableField
                      value={entry?.mostImportantTask?.actualTime || ''}
                      onSave={(val) => updateTask('mostImportantTask', entry?.mostImportantTask?.id || '', { actualTime: val })}
                      placeholder="0.0"
                      className="w-8 bg-transparent border-b border-paper-border/20 focus:outline-none text-center"
                    />
                    <span>h</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-cream-200/40 p-5 rounded-2xl border border-paper-border/30 shadow-sm mb-4">
                <div className="flex items-center">
                  <button onClick={() => toggleTask('mostImportantTask', entry?.mostImportantTask?.id || '')} className="mr-4">
                    {entry?.mostImportantTask?.completed ? 
                      <CheckCircle2 className="w-7 h-7 text-paper-text" /> : 
                      <Circle className="w-7 h-7 text-paper-text/20 hover:text-paper-text/40" />
                    }
                  </button>
                  <EditableField
                    value={entry?.mostImportantTask?.text || ''}
                    onSave={(val) => updateTask('mostImportantTask', entry?.mostImportantTask?.id || '', { text: val })}
                    placeholder="最優先事項を入力..."
                    className={`flex-grow bg-transparent focus:outline-none font-serif italic text-lg ${entry?.mostImportantTask?.completed ? 'line-through opacity-40' : ''}`}
                  />
                </div>
                
                {/* Progress Dots (30 min sessions) */}
                <div className="mt-4 pt-4 border-t border-paper-border/10 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-paper-text/30">Progress (30m sessions)</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateSessions(i + 1 === entry?.mostImportantTask?.sessions ? i : i + 1)}
                        className={`w-3 h-3 rounded-full border transition-all ${
                          i < (entry?.mostImportantTask?.sessions || 0) 
                            ? 'bg-paper-text border-paper-text shadow-sm' 
                            : 'border-paper-border/40 bg-transparent hover:border-paper-text/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-paper-text/50 mb-4 font-bold">Secondary Tasks</h2>
              <div className="space-y-4">
                {(entry?.secondaryTasks || [
                  { id: 'sec-1', text: '', completed: false },
                  { id: 'sec-2', text: '', completed: false }
                ]).map((task, i) => (
                  <div key={task.id || i} className="flex items-center px-2">
                    <button onClick={() => toggleTask('secondaryTasks', task.id)} className="mr-3">
                      {task.completed ? 
                        <CheckCircle2 className="w-5 h-5 text-paper-text/60" /> : 
                        <Circle className="w-5 h-5 text-paper-text/20" />
                      }
                    </button>
                    <EditableField
                      value={task.text || ''}
                      onSave={(val) => updateTask('secondaryTasks', task.id, { text: val })}
                      placeholder="重要タスクを入力..."
                      className={`flex-grow bg-transparent border-b border-paper-border/10 focus:border-paper-border focus:outline-none py-1 text-sm ${task.completed ? 'line-through opacity-40' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Timeline Section */}
        <section className="bg-cream-50 py-8 rounded-2xl border border-paper-border shadow-sm relative overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-paper-text/10" />
          <Timeline 
            events={entry?.timeline || []} 
            onSave={handleTimelineSave} 
            selectedDate={selectedDate}
          />
        </section>
      </div>

      <footer className="mt-20 pt-10 border-t border-paper-border/20 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-paper-text/40 font-bold">Highlight of the Day</h3>
          <EditableField
            type="textarea"
            value={entry?.highlight || ''}
            onSave={(val) => saveEntry({ highlight: val })}
            className="w-full bg-cream-50/30 border border-paper-border/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/30 text-sm min-h-[100px] italic transition-all"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-paper-text/40 font-bold">What I Learned</h3>
          <EditableField
            type="textarea"
            value={entry?.learning || ''}
            onSave={(val) => saveEntry({ learning: val })}
            className="w-full bg-cream-50/30 border border-paper-border/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/30 text-sm min-h-[100px] italic transition-all"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-paper-text/40 font-bold">To Remember</h3>
          <EditableField
            type="textarea"
            value={entry?.remember || ''}
            onSave={(val) => saveEntry({ remember: val })}
            className="w-full bg-cream-50/30 border border-paper-border/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-paper-border/30 text-sm min-h-[100px] italic transition-all"
          />
        </div>
      </footer>
    </div>
  );
};

export default DailyView;
