import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Chat from './components/Chat'
import Navbar from './components/Navbar'
import './App.css'
import { personalities as localPersonalities } from './data/personalities'
import DisclaimerModal from './components/DisclaimerModal'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('')
  const [personalities, setPersonalities] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiProfile, setAIProfile] = useState<any>(null)

  useEffect(() => {
    // Load local personalities
    setPersonalities(localPersonalities)
    const savedUser = localStorage.getItem('userProfile')



  }, [])

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <DisclaimerModal />
          <Navbar
            userProfile={userProfile}
            aiProfile={aiProfile}
          />
          <Routes>
            <Route path="/" element={<Chat personality={selectedPersonality} setPersonality={setSelectedPersonality} personalities={personalities} userProfile={userProfile} aiProfile={aiProfile} />} />
            <Route path="/chat" element={<Chat personality={selectedPersonality} setPersonality={setSelectedPersonality} personalities={personalities} userProfile={userProfile} aiProfile={aiProfile} />} />
          </Routes>
          {/* Settings modal removed as per user request */}
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
