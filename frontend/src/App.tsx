import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Chat from './components/Chat'
import Navbar from './components/Navbar'
import Settings from './components/Settings'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://jarrett-balloonlike-julietta.ngrok-free.dev'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('default')
  const [personalities, setPersonalities] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiProfile, setAIProfile] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchPersonalities()
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

  const fetchPersonalities = async () => {
    try {
      const response = await fetch(`${API_URL}/personalities`)
      const data = await response.json()
      setPersonalities(data)
    } catch (error) {
      console.error('Failed to fetch personalities:', error)
    }
  }

  const handleSettingsSave = (user: any, ai: any) => {
    setUserProfile(user)
    setAIProfile(ai)
    setSelectedPersonality(ai.personality)
    localStorage.setItem('userProfile', JSON.stringify(user))
    localStorage.setItem('aiProfile', JSON.stringify(ai))
    localStorage.setItem('selectedPersonality', ai.personality)
    setShowSettings(false)
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar 
            userProfile={userProfile} 
            aiProfile={aiProfile}
            onSettingsClick={() => setShowSettings(true)}
          />
          <Routes>
            <Route path="/" element={<Chat personality={selectedPersonality} userProfile={userProfile} aiProfile={aiProfile} />} />
            <Route path="/chat" element={<Chat personality={selectedPersonality} userProfile={userProfile} aiProfile={aiProfile} />} />
          </Routes>
          {showSettings && (
            <Settings
              userProfile={userProfile}
              aiProfile={aiProfile}
              personalities={personalities}
              onSave={handleSettingsSave}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
