import Dexie, { type Table } from 'dexie';

export interface WeeklyTask {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyEntry {
  id: string; // YYYY-WW (例: 2023-51)
  startDate: string;
  intention: string;
  mostImportantTasks: WeeklyTask[];
  secondaryTasks: WeeklyTask[];
  additionalTasks: WeeklyTask[];
  yearlyGoalActions?: {
    [goalIndex: number]: {
      id: string;
      text: string;
      completed: boolean;
    }[]
  }; // 年間目標に基づいた今週のアクション (配列)
  nextWeekGoals?: WeeklyTask[]; // 来週への種まき
  reflection?: string;
  gratitude?: string;
  updatedAt: number;
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  targetTime?: string;
  actualTime?: string;
  sessions?: number; // 30分単位のセッション数
}

export interface TimelineEvent {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  text: string;
  color?: string;
}

export interface Habit {
  id: string;
  name: string;
  category?: string;
  createdAt: number;
}

export interface DailyEntry {
  id: string; // YYYY-MM-DD
  date: string;
  gratitude: string[]; // 3 items
  intention: string;
  mostImportantTask: DailyTask;
  secondaryTasks: DailyTask[]; // 2 items
  additionalTasks: DailyTask[]; // 2 items
  habitCompletion: { [habitId: string]: boolean };
  highlight: string;
  learning: string;
  remember: string;
  mood: number; // 1-5
  rateDay: number; // 1-5
  timeline: TimelineEvent[];
  updatedAt: number;
}

export interface MonthlyEntry {
  id: string; // YYYY-MM
  intention: string;
  goals: { id: string; text: string; completed: boolean }[];
  nextMonthGoals?: { id: string; text: string; completed: boolean }[];
  reflection: string;
  gratitude?: string;
  learning?: string;
  updatedAt: number;
}

export interface YearlyGoal {
  id: string;
  text: string;
  completed: boolean;
  monthlyActions: {
    [key: number]: {
      text: string;
      completed: boolean;
    }
  }; // 1-12
  reflection?: string; // 各目標の振り返り
}

export interface YearlyEntry {
  id: string; // YYYY
  theme: string;
  goals: YearlyGoal[];
  reflection: string;
  updatedAt: number;
}

export interface MandalaEntry {
  id: string; // e.g., 'main'
  mainGoal: string;
  // Visual layout:
  // A B C
  // H X D
  // G F E
  // We can store subGoals as an array of 8 items, indices 0-7 mapping to A-H
  subGoals: {
    text: string;
    items: string[]; // 8 items for the spread-out chart
  }[];
  updatedAt: number;
}

export class JournalDatabase extends Dexie {
  weeklyEntries!: Table<WeeklyEntry>;
  dailyEntries!: Table<DailyEntry>;
  monthlyEntries!: Table<MonthlyEntry>;
  yearlyEntries!: Table<YearlyEntry>;
  mandalaEntries!: Table<MandalaEntry>;
  habits!: Table<Habit>;

  constructor() {
    super('JournalDatabase');
    this.version(6).stores({
      weeklyEntries: 'id, startDate, updatedAt',
      dailyEntries: 'id, date, updatedAt',
      monthlyEntries: 'id, updatedAt',
      yearlyEntries: 'id, updatedAt',
      habits: 'id, name'
    });
    this.version(7).stores({
      mandalaEntries: 'id, updatedAt'
    });
    this.version(8).stores({
      habits: 'id, name, createdAt'
    });
  }
}

export const db = new JournalDatabase();

// Safari Private Browsing / IndexedDB availability check
db.open().catch((error) => {
  console.error('Failed to open database:', error);
  if (error.name === 'InvalidStateError' || error.message?.includes('private')) {
    console.warn('IndexedDB is not available. You may be in Private Browsing mode.');
  }
});
