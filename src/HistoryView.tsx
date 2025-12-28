import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Search, Calendar, ChevronRight, Target, Sparkles, BookOpen } from 'lucide-react';

interface HistoryViewProps {
  onEntrySelect: (date: Date, view: EntryType) => void;
}

type EntryType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface SearchResult {
  id: string;
  date: string;
  type: EntryType;
  title: string;
  content: string;
  timestamp: number;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onEntrySelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');

  const dailyEntries = useLiveQuery(() => db.dailyEntries.toArray()) || [];
  const weeklyEntries = useLiveQuery(() => db.weeklyEntries.toArray()) || [];
  const monthlyEntries = useLiveQuery(() => db.monthlyEntries.toArray()) || [];
  const yearlyEntries = useLiveQuery(() => db.yearlyEntries.toArray()) || [];

  const results: SearchResult[] = React.useMemo(() => {
    const allResults: SearchResult[] = [];

    // Process Daily
    dailyEntries.forEach(entry => {
      const texts = [
        ...entry.gratitude,
        entry.intention,
        entry.mostImportantTask.text,
        ...entry.secondaryTasks.map(t => t.text),
        ...entry.additionalTasks.map(t => t.text),
        entry.highlight,
        entry.learning,
        entry.remember
      ].filter(Boolean);

      const content = texts.join(' ');
      if (!searchQuery || content.toLowerCase().includes(searchQuery.toLowerCase())) {
        allResults.push({
          id: entry.id,
          date: entry.date,
          type: 'daily',
          title: new Date(entry.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }),
          content: texts.slice(0, 3).join(' / '),
          timestamp: new Date(entry.date).getTime()
        });
      }
    });

    // Process Weekly
    weeklyEntries.forEach(entry => {
      const texts = [
        entry.intention,
        ...entry.mostImportantTasks.map(t => t.text),
        ...entry.secondaryTasks.map(t => t.text),
        ...entry.additionalTasks.map(t => t.text)
      ].filter(Boolean);

      const content = texts.join(' ');
      if (!searchQuery || content.toLowerCase().includes(searchQuery.toLowerCase())) {
        allResults.push({
          id: entry.id,
          date: entry.startDate,
          type: 'weekly',
          title: `Week ${entry.id.split('-')[1]}, ${entry.id.split('-')[0]}`,
          content: entry.intention || texts.slice(0, 2).join(' / '),
          timestamp: new Date(entry.startDate).getTime()
        });
      }
    });

    // Process Monthly
    monthlyEntries.forEach(entry => {
      const texts = [
        entry.intention,
        ...entry.goals.map(g => g.text),
        entry.reflection
      ].filter(Boolean);

      const content = texts.join(' ');
      if (!searchQuery || content.toLowerCase().includes(searchQuery.toLowerCase())) {
        const [y, m] = entry.id.split('-');
        allResults.push({
          id: entry.id,
          date: entry.id,
          type: 'monthly',
          title: `${y}年 ${parseInt(m)}月`,
          content: entry.intention || entry.reflection || texts.slice(0, 2).join(' / '),
          timestamp: new Date(parseInt(y), parseInt(m) - 1, 1).getTime()
        });
      }
    });

    // Process Yearly
    yearlyEntries.forEach(entry => {
      const texts = [
        entry.theme,
        ...entry.goals.map(g => g.text),
        entry.reflection
      ].filter(Boolean);

      const content = texts.join(' ');
      if (!searchQuery || content.toLowerCase().includes(searchQuery.toLowerCase())) {
        allResults.push({
          id: entry.id,
          date: entry.id,
          type: 'yearly',
          title: `${entry.id}年 Yearly Overview`,
          content: entry.theme || entry.reflection || texts.slice(0, 2).join(' / '),
          timestamp: new Date(parseInt(entry.id), 0, 1).getTime()
        });
      }
    });

    return allResults
      .filter(r => filterType === 'all' || r.type === filterType)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [dailyEntries, weeklyEntries, monthlyEntries, yearlyEntries, searchQuery, filterType]);

  const getIcon = (type: EntryType) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4 text-rose-400" />;
      case 'weekly': return <Target className="w-4 h-4 text-indigo-400" />;
      case 'monthly': return <BookOpen className="w-4 h-4 text-teal-400" />;
      case 'yearly': return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <header className="mb-10 border-b border-paper-border pb-8">
        <h1 className="text-4xl font-serif text-paper-text font-bold tracking-tight mb-6">Archive & Search</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-paper-text/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="過去の記録をキーワードで検索..."
              className="w-full bg-cream-50 border border-paper-border/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-paper-border/20 shadow-inner text-sm transition-all"
            />
          </div>
          
          <div className="flex gap-2 p-1 bg-cream-50 rounded-2xl border border-paper-border/30 shadow-inner overflow-x-auto no-scrollbar">
            {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`
                  px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                  ${filterType === t 
                    ? 'bg-paper-text text-cream-50 shadow-md' 
                    : 'text-paper-text/40 hover:bg-cream-100'}
                `}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                // 型に応じた日付オブジェクトを作成
                let date: Date;
                if (result.type === 'daily') date = new Date(result.date);
                else if (result.type === 'weekly') date = new Date(result.date);
                else if (result.type === 'monthly') {
                  const [y, m] = result.id.split('-');
                  date = new Date(parseInt(y), parseInt(m) - 1, 1);
                } else {
                  date = new Date(parseInt(result.id), 0, 1);
                }
                onEntrySelect(date, result.type);
              }}
              className="w-full text-left bg-cream-50/50 p-6 rounded-2xl border border-paper-border/20 hover:border-paper-border/60 hover:bg-cream-50 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-paper-border/10 shadow-sm">
                    {getIcon(result.type)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-paper-text/80 group-hover:text-paper-text transition-colors">
                      {result.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-paper-text/30 font-bold">
                      {result.type}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-paper-text/20 group-hover:text-paper-text group-hover:translate-x-1 transition-all" />
              </div>
              
              <p className="text-sm font-serif text-paper-text/60 leading-relaxed line-clamp-2 pl-11">
                {result.content || '(本文なし)'}
              </p>
            </button>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-cream-50 rounded-full border border-dashed border-paper-border/40 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-paper-text/20" />
            </div>
            <p className="text-paper-text/30">該当する記録が見つかりませんでした。</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-paper-text/60 border-b border-paper-border hover:text-paper-text transition-colors"
              >
                検索条件をクリア
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;

