import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Chat from './components/Chat'
import ImageGen from './components/ImageGen'
import VideoGen from './components/VideoGen'
import CodeAssistant from './components/CodeAssistant'
import Navbar from './components/Navbar'
import PersonalitySelector from './components/PersonalitySelector'
import Onboarding from './components/Onboarding'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://jarrett-balloonlike-julietta.ngrok-free.dev'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('default')
  const [personalities, setPersonalities] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiProfile, setAIProfile] = useState<any>(null)
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem('onboardingComplete') === 'true'
  })

  useEffect(() => {
    fetchPersonalities()
    const savedUser = localStorage.getItem('userProfile')
    const savedAI = localStorage.getItem('aiProfile')
    if (savedUser) setUserProfile(JSON.parse(savedUser))
    if (savedAI) setAIProfile(JSON.parse(savedAI))
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

  const handleOnboardingComplete = (user: any, ai: any) => {
    setUserProfile(user)
    setAIProfile(ai)
    setSelectedPersonality(ai.personality)
    localStorage.setItem('userProfile', JSON.stringify(user))
    localStorage.setItem('aiProfile', JSON.stringify(ai))
    localStorage.setItem('onboardingComplete', 'true')
    setOnboardingComplete(true)
  }

  if (!onboardingComplete) {
    return (
      <ThemeProvider>
        <Onboarding
          onComplete={handleOnboardingComplete}
          personalities={personalities}
        />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar userProfile={userProfile} aiProfile={aiProfile} />
          <PersonalitySelector
            personalities={personalities}
            selected={selectedPersonality}
            onSelect={setSelectedPersonality}
            aiProfile={aiProfile}
          />
          <Routes>
            <Route path="/" element={<Chat personality={selectedPersonality} userProfile={userProfile} aiProfile={aiProfile} />} />
            <Route path="/chat" element={<Chat personality={selectedPersonality} userProfile={userProfile} aiProfile={aiProfile} />} />
            <Route path="/code" element={<CodeAssistant personality={selectedPersonality} />} />
            <Route path="/image" element={<ImageGen />} />
            <Route path="/video" element={<VideoGen />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
