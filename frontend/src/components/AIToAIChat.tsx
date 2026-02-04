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
  const [loadingFor, setLoadingFor] = useState<'ai1' | 'ai2' | null>(null)
  const [autoContinue, setAutoContinue] = useState(true) // Enabled by default
  const [maxTurns, setMaxTurns] = useState(200) // Limit to prevent infinite loops
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  // Auto-continue logic - continuously keep the conversation going
  useEffect(() => {
    if (!autoContinue || loading || conversation.length === 0) return
    
    const lastMessage = conversation[conversation.length - 1]
    const turnCount = conversation.filter(m => m.role === 'ai1' || m.role === 'ai2').length
    
    // Only auto-continue if we have at least 2 messages (both AIs have spoken once)
    // And if we haven't exceeded max turns
    if (conversation.length >= 2 && turnCount < maxTurns && (lastMessage.role === 'ai1' || lastMessage.role === 'ai2')) {
      const timer = setTimeout(() => {
        // Double-check we're not loading and auto-continue is still enabled
        if (!loading && autoContinue) {
          console.log(`🔄 Auto-continuing conversation... (turn ${turnCount}/${maxTurns})`)
          continueConversation()
        }
      }, 1500) // Wait 1.5 seconds before continuing
      return () => clearTimeout(timer)
    } else if (turnCount >= maxTurns) {
      console.log('⏹️ Reached max turns, stopping auto-continue')
      setAutoContinue(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.length, autoContinue, loading, maxTurns])

  const startConversation = async () => {
    if (!ai1 || !ai2) {
      alert('Please select both AI personalities')
      return
    }

    if (ai1 === ai2) {
      alert('Please select two different personalities')
      return
    }

    // Enable auto-continue by default
    setAutoContinue(true)
    setLoading(true)
    setLoadingFor('ai1')
    setConversation([])

    try {
      console.log('🚀 Starting AI-to-AI conversation:', { ai1, ai2 })
      
      // Step 1: Get AI 1's initial message
      const response1 = await fetch(`${API_URL}/api/ai-to-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
          body: JSON.stringify({
            personality1: ai1,
            personality2: ai2,
            conversation: [],
            max_turns: maxTurns
          })
      })

      if (!response1.ok) {
        const errorText = await response1.text()
        throw new Error(`HTTP ${response1.status}: ${errorText}`)
      }

      const data1 = await response1.json()
      console.log('✅ AI 1 message received:', data1)
      
      if (data1.conversation && Array.isArray(data1.conversation)) {
        setConversation(data1.conversation)
        
        // Step 2: Immediately get AI 2's response
        setLoadingFor('ai2')
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
        
        const response2 = await fetch(`${API_URL}/api/ai-to-ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personality1: ai1,
            personality2: ai2,
            conversation: data1.conversation,
            max_turns: maxTurns
          })
        })

        if (!response2.ok) {
          const errorText = await response2.text()
          throw new Error(`HTTP ${response2.status}: ${errorText}`)
        }

        const data2 = await response2.json()
        console.log('✅ AI 2 message received:', data2)
        
        if (data2.conversation && Array.isArray(data2.conversation)) {
          setConversation(data2.conversation)
          // Auto-continue will trigger via useEffect after this state update
        }
      } else {
        console.error('❌ Invalid conversation data:', data1)
        alert('Received invalid response from server.')
      }
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error)
      alert(`Failed to start conversation: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
      setLoadingFor(null)
    }
  }

  const continueConversation = async () => {
    if (!ai1 || !ai2 || conversation.length === 0) return

    const lastMessage = conversation[conversation.length - 1]
    const nextTurn = lastMessage.role === 'ai1' ? 'ai2' : 'ai1'
    
    setLoading(true)
    setLoadingFor(nextTurn)

    try {
      console.log('🔄 Continuing conversation, current length:', conversation.length)
      console.log('👤 Next turn:', nextTurn)
      
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
          max_turns: maxTurns
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
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
      setLoadingFor(null)
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
          Watch Mode
        </h2>
        <div className="ai-selectors">
          <div className="ai-selector">
            <label>Personality 1</label>
            <select value={ai1} onChange={(e) => setAI1(e.target.value)} disabled={conversation.length > 0}>
              <option value="">Choose personality...</option>
              {personalities.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="ai-selector">
            <label>Personality 2</label>
            <select value={ai2} onChange={(e) => setAI2(e.target.value)} disabled={conversation.length > 0}>
              <option value="">Choose personality...</option>
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
                Auto-continue {autoContinue ? '(ON)' : '(OFF)'}
              </label>
            </>
          )}
        </div>
      </div>

      <div className="ai-to-ai-messages">
        {conversation.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>Select two personalities to watch them converse</p>
            <p className="hint">Personality 1 will initiate the conversation</p>
          </div>
        ) : (
          conversation.map((msg, idx) => {
            const isAI1 = msg.role === 'ai1'
            const name = msg.name || (isAI1 ? ai1Name : ai2Name)
            return (
              <div key={idx} className="ai-message-wrapper">
                <div className={`ai-message ${msg.role}`}>
                  <div className="ai-message-content-wrapper">
                    <div className="ai-message-header">
                      <span className="ai-name">{name}</span>
                      <span className="ai-badge">{isAI1 ? 'AI 1' : 'AI 2'}</span>
                    </div>
                    <div className="ai-message-content">{msg.content}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        {loading && loadingFor && (
          <div className="ai-message-wrapper">
            <div className={`ai-message ${loadingFor}`}>
              <div className="ai-message-content-wrapper">
                <div className="ai-message-header">
                  <span className="ai-name">{loadingFor === 'ai1' ? ai1Name : ai2Name}</span>
                  <span className="ai-badge">{loadingFor === 'ai1' ? 'AI 1' : 'AI 2'}</span>
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
