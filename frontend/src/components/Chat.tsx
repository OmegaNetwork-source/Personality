import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Copy, Check } from 'lucide-react'
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Handle file upload - you can add file processing logic here
      console.log('File selected:', file.name, file.type, file.size)
      
      // For now, add a message showing the file was attached
      // You can extend this to actually process/upload the file
      const fileInfo = `📎 Attached: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
      setInput(prev => prev ? `${prev}\n${fileInfo}` : fileInfo)
      
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

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

  const hasMessages = messages.length > 0

  return (
    <div className="chat-container">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        multiple
      />
      {!hasMessages ? (
        <div className="chat-welcome-screen">
          <div className="welcome-content">
            <h1 className="welcome-title">What can I help with?</h1>
            <div className="welcome-input-container">
              <input
                className="welcome-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask anything"
                disabled={loading}
              />
              <div className="welcome-input-actions">
                <button className="input-action-btn" onClick={handleFileUpload} title="Attach file">
                  <Paperclip size={18} />
                  <span>Attach</span>
                </button>
                <button className="input-action-btn send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.role}`}>
                <div className={`message ${msg.role}`}>
                  <div className="message-content-wrapper">
                    <div className="message-content">{msg.content}</div>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopy(msg.content, idx)}
                      title="Copy message"
                    >
                      {copiedIndex === idx ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-wrapper assistant">
                <div className="message assistant">
                  <div className="message-content">
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
          <div className="chat-input-container">
            <button className="attach-button" onClick={handleFileUpload} title="Attach file">
              <Paperclip size={20} />
            </button>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything"
              disabled={loading}
            />
            <button className="send-button" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
