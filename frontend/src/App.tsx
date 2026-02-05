import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Chat from './components/Chat'
import AIToAIChat from './components/AIToAIChat'
import Navbar from './components/Navbar'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('vietnam_vet')
  const [personalities, setPersonalities] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiProfile, setAIProfile] = useState<any>(null)

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
      console.log('🔍 Fetching personalities from:', `${API_URL}/personalities`)

      const response = await fetch(`${API_URL}/personalities`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      })

      console.log('📡 Response status:', response.status, response.statusText)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response not OK:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Successfully loaded personalities:', data.length, 'personalities')
      console.log('📋 Personality IDs:', data.map((p: any) => p.id))
      setPersonalities(data)
    } catch (error: any) {
      console.error('❌ Failed to fetch personalities:', error)
      console.error('🔗 API URL being used:', API_URL)
      console.error('💡 Check if:')
      console.error('   1. Backend server is running')
      console.error('   2. API URL is correct:', API_URL)
      console.error('   3. CORS is configured correctly')
      console.error('   4. Network connection is working')
      console.error('   5. ngrok tunnel is active')

      // Set empty array on error so UI doesn't break
      setPersonalities([])
    }
  }

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
            <Route path="/ai-to-ai" element={<AIToAIChat personalities={personalities} />} />
          </Routes>
          {/* Settings modal removed as per user request */}
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
