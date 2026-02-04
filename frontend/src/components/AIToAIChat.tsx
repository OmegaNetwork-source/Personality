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
  const messagesStartRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToTop()
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

  // Group personalities by category
  const groupedPersonalities = personalities.reduce((acc, personality) => {
    const category = personality.category || 'Standard AI'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(personality)
    return acc
  }, {} as Record<string, typeof personalities>)

  // Define category order
  const categoryOrder = ['Funny', 'Ethnic', 'Standard AI']

  return (
    <div className="ai-to-ai-container">
      {conversation.length === 0 ? (
        <div className="ai-to-ai-header">
          <div className="ai-selectors-compact">
            <select value={ai1} onChange={(e) => setAI1(e.target.value)} className="compact-select">
              <option value="">Choose personality 1...</option>
              {categoryOrder.map(category => {
                const categoryPersonalities = groupedPersonalities[category] || []
                if (categoryPersonalities.length === 0) return null
                return (
                  <optgroup key={category} label={category}>
                    {categoryPersonalities.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            <select value={ai2} onChange={(e) => setAI2(e.target.value)} className="compact-select">
              <option value="">Choose personality 2...</option>
              {categoryOrder.map(category => {
                const categoryPersonalities = groupedPersonalities[category] || []
                if (categoryPersonalities.length === 0) return null
                return (
                  <optgroup key={category} label={category}>
                    {categoryPersonalities.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
          <div className="ai-to-ai-controls">
            <button className="btn-primary btn-start" onClick={startConversation} disabled={loading || !ai1 || !ai2}>
              <Play size={18} />
              Start
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-to-ai-controls-bar">
          <div className="controls-left">
            <button className="btn-secondary btn-compact" onClick={resetConversation}>
              <RotateCcw size={18} />
              Reset
            </button>
            <button className="btn-primary btn-compact" onClick={continueConversation} disabled={loading}>
              <Send size={18} />
              {loading ? 'Thinking...' : 'Continue'}
            </button>
          </div>
          <label className="auto-continue-compact">
            <input
              type="checkbox"
              checked={autoContinue}
              onChange={(e) => setAutoContinue(e.target.checked)}
            />
            <span>Auto-continue</span>
          </label>
        </div>
      )}

      <div className="ai-to-ai-messages">
        <div ref={messagesStartRef} />
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
        {conversation.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>Select two personalities to watch them converse</p>
            <p className="hint">Personality 1 will initiate the conversation</p>
          </div>
        ) : (
          [...conversation].reverse().map((msg, idx) => {
            const isAI1 = msg.role === 'ai1'
            const name = msg.name || (isAI1 ? ai1Name : ai2Name)
            return (
              <div key={conversation.length - 1 - idx} className="ai-message-wrapper">
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
      </div>
    </div>
  )
}
