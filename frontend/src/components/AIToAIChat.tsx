import { useState, useEffect, useRef } from 'react'
import { Send, Bot, Play, RotateCcw } from 'lucide-react'
import './AIToAIChat.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://jarrett-balloonlike-julietta.ngrok-free.dev'

interface Props {
  personalities: Array<{ id: string; name: string; description: string }>
}

export default function AIToAIChat({ personalities }: Props) {
  const [ai1, setAI1] = useState<string>('')
  const [ai2, setAI2] = useState<string>('')
  const [conversation, setConversation] = useState<Array<{ role: string; content: string; name?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [autoContinue, setAutoContinue] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  // Auto-continue logic
  useEffect(() => {
    if (!autoContinue || loading || conversation.length === 0) return
    
    const lastMessage = conversation[conversation.length - 1]
    // Only auto-continue if we have at least 2 messages (both AIs have spoken once)
    // This prevents infinite loops
    if (conversation.length >= 2 && (lastMessage.role === 'ai1' || lastMessage.role === 'ai2')) {
      const timer = setTimeout(() => {
        if (!loading) {
          continueConversation()
        }
      }, 2000) // Wait 2 seconds before continuing
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.length, autoContinue])

  const startConversation = async () => {
    if (!ai1 || !ai2) {
      alert('Please select both AI personalities')
      return
    }

    if (ai1 === ai2) {
      alert('Please select two different personalities')
      return
    }

    setLoading(true)
    setConversation([])

    try {
      console.log('🚀 Starting AI-to-AI conversation:', { ai1, ai2 })
      console.log('📡 API URL:', `${API_URL}/api/ai-to-ai/chat`)
      
      const response = await fetch(`${API_URL}/api/ai-to-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          personality1: ai1,
          personality2: ai2,
          conversation: [],
          max_turns: 10
        })
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Conversation data received:', data)
      console.log('💬 Conversation messages:', data.conversation?.length || 0)
      
      if (data.conversation && Array.isArray(data.conversation)) {
        setConversation(data.conversation)
        console.log('✅ Conversation state updated')
      } else {
        console.error('❌ Invalid conversation data:', data)
        alert('Received invalid response from server. Check console for details.')
      }
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Failed to start conversation: ${error.message || 'Unknown error'}. Check console for details.`)
    } finally {
      setLoading(false)
    }
  }

  const continueConversation = async () => {
    if (!ai1 || !ai2 || conversation.length === 0) return

    setLoading(true)

    try {
      console.log('🔄 Continuing conversation, current length:', conversation.length)
      
      const response = await fetch(`${API_URL}/api/ai-to-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          personality1: ai1,
          personality2: ai2,
          conversation: conversation,
          max_turns: 10
        })
      })

      console.log('📡 Continue response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Continue error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Continue data received:', data)
      
      if (data.conversation && Array.isArray(data.conversation)) {
        setConversation(data.conversation)
      } else {
        console.error('❌ Invalid conversation data:', data)
        alert('Received invalid response from server.')
      }
    } catch (error: any) {
      console.error('❌ Failed to continue conversation:', error)
      alert(`Failed to continue conversation: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const resetConversation = () => {
    setConversation([])
    setAutoContinue(false)
  }

  const ai1Name = personalities.find(p => p.id === ai1)?.name || 'AI 1'
  const ai2Name = personalities.find(p => p.id === ai2)?.name || 'AI 2'

  return (
    <div className="ai-to-ai-container">
      <div className="ai-to-ai-header">
        <h2>
          <Bot size={24} />
          AI-to-AI Chat
        </h2>
        <div className="ai-selectors">
          <div className="ai-selector">
            <label>AI 1 (Initiates)</label>
            <select value={ai1} onChange={(e) => setAI1(e.target.value)} disabled={conversation.length > 0}>
              <option value="">Select AI 1</option>
              {personalities.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="ai-selector">
            <label>AI 2</label>
            <select value={ai2} onChange={(e) => setAI2(e.target.value)} disabled={conversation.length > 0}>
              <option value="">Select AI 2</option>
              {personalities.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="ai-to-ai-controls">
          {conversation.length === 0 ? (
            <button className="btn-primary" onClick={startConversation} disabled={loading || !ai1 || !ai2}>
              <Play size={18} />
              Start Conversation
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={resetConversation}>
                <RotateCcw size={18} />
                Reset
              </button>
              <button className="btn-primary" onClick={continueConversation} disabled={loading}>
                <Send size={18} />
                {loading ? 'Thinking...' : 'Continue'}
              </button>
              <label className="auto-continue">
                <input
                  type="checkbox"
                  checked={autoContinue}
                  onChange={(e) => setAutoContinue(e.target.checked)}
                />
                Auto-continue
              </label>
            </>
          )}
        </div>
      </div>

      <div className="ai-to-ai-messages">
        {conversation.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>Select two AI personalities and click "Start Conversation"</p>
            <p className="hint">AI 1 will initiate the conversation</p>
          </div>
        ) : (
          conversation.map((msg, idx) => {
            const isAI1 = msg.role === 'ai1'
            const name = msg.name || (isAI1 ? ai1Name : ai2Name)
            return (
              <div key={idx} className={`ai-message ${msg.role}`}>
                <div className="ai-message-header">
                  <Bot size={16} />
                  <span className="ai-name">{name}</span>
                  <span className="ai-badge">{isAI1 ? 'AI 1' : 'AI 2'}</span>
                </div>
                <div className="ai-message-content">{msg.content}</div>
              </div>
            )
          })
        )}
        {loading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
