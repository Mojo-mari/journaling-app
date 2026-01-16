import { useState } from 'react'
import { startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import WeeklyView from './WeeklyView'
import DailyView from './DailyView'
import MonthlyView from './MonthlyView'
import YearlyView from './YearlyView'
import HistoryView from './HistoryView'
import Layout from './components/Layout'

type View = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'history'

function App() {
  const [currentView, setCurrentView] = useState<View>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())

  // ビューが切り替わった時に適切な日付を設定
  const handleViewChange = (view: View) => {
    const today = new Date()
    let defaultDate: Date

    switch (view) {
      case 'daily':
        defaultDate = today // 今日
        break
      case 'weekly':
        defaultDate = startOfWeek(today, { weekStartsOn: 1 }) // 今週の開始日（月曜日）
        break
      case 'monthly':
        defaultDate = startOfMonth(today) // 今月の1日
        break
      case 'yearly':
        defaultDate = startOfYear(today) // 今年の1月1日
        break
      case 'history':
        defaultDate = selectedDate // historyの場合は現在の日付を維持
        break
      default:
        defaultDate = today
    }

    setSelectedDate(defaultDate)
    setCurrentView(view)
  }

  const renderView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      case 'monthly':
        return <MonthlyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      case 'yearly':
        return <YearlyView key={selectedDate.getFullYear()} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      case 'history':
        return <HistoryView onEntrySelect={(date, view) => {
          setSelectedDate(date);
          setCurrentView(view);
        }} />
      case 'weekly':
      default:
        return <WeeklyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
    }
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={handleViewChange}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    >
      {renderView()}
    </Layout>
  )
}

export default App
