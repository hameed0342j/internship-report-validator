import { ReportValidator } from './components/ReportValidator'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="internship-validator-theme">
      <ReportValidator />
    </ThemeProvider>
  )
}

export default App
