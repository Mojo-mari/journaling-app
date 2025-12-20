import { useState } from 'react'
import WeeklyView from './WeeklyView'
import DailyView from './DailyView'
import MonthlyView from './MonthlyView'
import YearlyView from './YearlyView'
import HistoryView from './HistoryView'
import Layout from './components/Layout'

type View = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'history'

function App() {
  const [currentView, setCurrentView] = useState<View>('weekly')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const renderView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      case 'monthly':
        return <MonthlyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      case 'yearly':
        return <YearlyView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
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
      onViewChange={setCurrentView}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    >
      {renderView()}
    </Layout>
  )
}

export default App
