import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Chat from './components/Chat'
import Navbar from './components/Navbar'
import './App.css'
import { personalities as localPersonalities } from './data/personalities'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('vietnam_vet')
  const [personalities, setPersonalities] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiProfile, setAIProfile] = useState<any>(null)

  useEffect(() => {
    // Load local personalities
    setPersonalities(localPersonalities)
    const savedUser = localStorage.getItem('userProfile')
    const savedAI = localStorage.getItem('aiProfile')
    const savedPersonality = localStorage.getItem('selectedPersonality')
    if (savedUser) setUserProfile(JSON.parse(savedUser))
    if (savedAI) {
      const ai = JSON.parse(savedAI)
      setAIProfile(ai)
      if (ai.personality) setSelectedPersonality(ai.personality)
    }
    if (savedPersonality) setSelectedPersonality(savedPersonality)
  }, [])

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
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
