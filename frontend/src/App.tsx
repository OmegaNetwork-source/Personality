import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Chat from './components/Chat'
import ImageGen from './components/ImageGen'
import VideoGen from './components/VideoGen'
import CodeAssistant from './components/CodeAssistant'
import Navbar from './components/Navbar'
import PersonalitySelector from './components/PersonalitySelector'
import './App.css'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState('default')
  const [personalities, setPersonalities] = useState<any[]>([])

  useEffect(() => {
    fetchPersonalities()
  }, [])

  const fetchPersonalities = async () => {
    try {
      const response = await fetch('http://localhost:8000/personalities')
      const data = await response.json()
      setPersonalities(data)
    } catch (error) {
      console.error('Failed to fetch personalities:', error)
    }
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <PersonalitySelector
          personalities={personalities}
          selected={selectedPersonality}
          onSelect={setSelectedPersonality}
        />
        <Routes>
          <Route path="/" element={<Chat personality={selectedPersonality} />} />
          <Route path="/chat" element={<Chat personality={selectedPersonality} />} />
          <Route path="/code" element={<CodeAssistant personality={selectedPersonality} />} />
          <Route path="/image" element={<ImageGen />} />
          <Route path="/video" element={<VideoGen />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
