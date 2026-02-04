import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import './Chat.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://jarrett-balloonlike-julietta.ngrok-free.dev'

interface Props {
  personality: string
  userProfile?: any
  aiProfile?: any
}

export default function Chat({ personality, userProfile, aiProfile }: Props) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Build context with user and AI profile info
      const context = []
      if (userProfile) {
        context.push({
          role: 'system',
          content: `User profile: Name: ${userProfile.name}, Ethnicity: ${userProfile.ethnicity}, Gender: ${userProfile.gender}${userProfile.interests ? ', Interests: ' + userProfile.interests : ''}${userProfile.background ? ', Background: ' + userProfile.background : ''}`
        })
      }
      if (aiProfile) {
        context.push({
          role: 'system',
          content: `AI profile: Name: ${aiProfile.name || 'AI Assistant'}, Ethnicity: ${aiProfile.ethnicity}, Gender: ${aiProfile.gender}${aiProfile.traits?.length ? ', Traits: ' + aiProfile.traits.join(', ') : ''}`
        })
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          personality: personality,
          user_profile: userProfile,
          ai_profile: aiProfile,
          stream: false
        })
      })

      const data = await response.json()
      const aiMessage = data.message?.content || data.response || 'No response'

      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Failed to get response. Make sure the backend is running.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>Welcome to AI Personality Platform</h2>
            <p>Start a conversation with your selected personality!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button className="send-button" onClick={sendMessage} disabled={loading}>
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
