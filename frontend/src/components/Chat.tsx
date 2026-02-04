import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Copy, Check, Eye, Volume2, VolumeX } from 'lucide-react'
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
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices (some browsers need this)
      window.speechSynthesis.getVoices()
      
      // Some browsers load voices asynchronously
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

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

  const handlePlayAudio = (content: string, index: number) => {
    if (playingIndex === index) {
      // If clicking the same message, stop playing
      setPlayingIndex(null)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return
    }

    // Stop any currently playing audio
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setPlayingIndex(index)

    try {
      // Use browser's built-in Web Speech API (free, no API key needed)
      if ('speechSynthesis' in window) {
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(content)
        
        // Use default robot voice settings
        utterance.rate = 1.0  // Normal speed
        utterance.pitch = 1.0  // Normal pitch
        utterance.volume = 1.0  // Full volume
        
        // Try to get a robot-like voice if available
        const voices = window.speechSynthesis.getVoices()
        const robotVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('robot') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha')
        )
        if (robotVoice) {
          utterance.voice = robotVoice
        }
        
        utterance.onend = () => {
          setPlayingIndex(null)
        }
        
        utterance.onerror = () => {
          setPlayingIndex(null)
        }
        
        window.speechSynthesis.speak(utterance)
      } else {
        throw new Error('Speech synthesis not supported in this browser')
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
      setPlayingIndex(null)
      alert('Speech synthesis not available. Please use a modern browser.')
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
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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

  // Extract HTML code blocks from message content
  // Handles cases where personality text might be interspersed
  const extractHtmlBlocks = (content: string): Array<{ code: string; start: number; end: number; previewCode: string }> => {
    const blocks: Array<{ code: string; start: number; end: number; previewCode: string }> = []
    
    // Strategy: Find code blocks, even if they're broken up by personality text
    // Look for patterns like ```html or ``` followed by HTML content
    
    // First, try to find complete code blocks
    const codeBlockRegex = /```(?:html|HTML)?\s*\n?([\s\S]*?)```/g
    let match
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      let code = match[1].trim()
      
      // Clean up code - remove personality interjections that might be in the code
      // Look for patterns like "*smiles*" or "*laughs*" or similar personality expressions
      const cleanedCode = code
        .replace(/\*[^*]+\*/g, '') // Remove *text* patterns
        .replace(/^[^*\n]*\*[^*\n]*$/gm, '') // Remove lines with only personality markers
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          // Filter out lines that are just personality expressions
          return trimmed && !trimmed.match(/^\*[^*]+\*$/) && !trimmed.match(/^[^*]*\*[^*]*$/)
        })
        .join('\n')
        .trim()
      
      // Check if it looks like HTML (contains HTML tags)
      const hasHtmlTags = /<[a-z][a-z0-9]*[\s>]/i.test(cleanedCode) || 
                         /<(html|head|body|div|span|p|h[1-6]|a|button|input|form|img|script|style|ul|ol|li|table|tr|td|th|header|footer|nav|section|article|main|aside|meta|title|link)/i.test(cleanedCode)
      
      if (hasHtmlTags && cleanedCode.length > 10) { // Ensure we have actual code, not just fragments
        // Prepare preview code - wrap in HTML structure if it's a fragment
        let previewCode = cleanedCode
        const isCompleteDocument = /<!DOCTYPE|<\s*html\s*>/i.test(cleanedCode)
        if (!isCompleteDocument) {
          // Wrap fragment in basic HTML structure for preview
          previewCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; padding: 20px; }
  </style>
</head>
<body>
${cleanedCode}
</body>
</html>`
        }
        
        blocks.push({
          code: code, // Original code with personality text for display (will be cleaned in render)
          previewCode, // Cleaned code for preview
          start: match.index,
          end: match.index + match[0].length
        })
      }
    }
    
    return blocks
  }

  // Parse message content and render with code blocks
  const renderMessageContent = (content: string) => {
    const htmlBlocks = extractHtmlBlocks(content)
    
    // Debug logging (can be removed in production)
    if (htmlBlocks.length > 0) {
      console.log('✅ Found HTML blocks:', htmlBlocks.length, htmlBlocks)
    } else {
      // Check if content has code blocks at all (for debugging)
      const hasCodeBlocks = /```[\s\S]*?```/.test(content)
      if (hasCodeBlocks) {
        console.log('⚠️ Found code blocks but no HTML detected. Content preview:', content.substring(0, 200))
      }
    }
    
    if (htmlBlocks.length === 0) {
      // No HTML blocks, render as plain text with basic markdown code block support
      return <div className="message-content-text">{content}</div>
    }

    const parts: JSX.Element[] = []
    let lastIndex = 0

    htmlBlocks.forEach((block, blockIndex) => {
      // Add text before the block
      if (block.start > lastIndex) {
        const textBefore = content.substring(lastIndex, block.start)
        if (textBefore.trim()) {
          parts.push(
            <div key={`text-${blockIndex}`} className="message-content-text">
              {textBefore}
            </div>
          )
        }
      }

      // Add the code block with preview button
      // Clean the displayed code too - remove personality interjections for better readability
      const displayCode = block.code
        .replace(/\*[^*]+\*/g, '') // Remove *text* patterns
        .replace(/^[^*\n]*\*[^*\n]*$/gm, '') // Remove lines with only personality markers
        .split('\n')
        .filter(line => line.trim() && !line.match(/^\s*\*[^*]+\*\s*$/)) // Remove lines that are just personality text
        .join('\n')
        .trim()
      
      if (displayCode.length > 0) {
        parts.push(
          <div key={`html-block-${blockIndex}`} className="html-code-block">
            <div className="code-block-header">
              <span className="code-block-label">HTML</span>
              <button
                className="preview-button"
                onClick={() => {
                  setPreviewHtml(block.previewCode)
                  setShowPreview(true)
                }}
                title="Preview HTML"
              >
                <Eye size={16} />
                Preview
              </button>
            </div>
            <pre className="code-block-content">
              <code>{displayCode}</code>
            </pre>
          </div>
        )
      }

      lastIndex = block.end
    })

    // Add remaining text after last block
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex)
      if (textAfter.trim()) {
        parts.push(
          <div key="text-after" className="message-content-text">
            {textAfter}
          </div>
        )
      }
    }

    return <div className="message-content-parsed">{parts}</div>
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
                onFocus={() => {
                  // On mobile, when user focuses input, it transitions to chat view
                  // The input will remain focused and ready for typing
                }}
                placeholder="Ask anything"
                disabled={loading}
              />
              <div className="welcome-input-actions">
                <button className="attach-button" onClick={handleFileUpload} title="Attach file">
                  <Paperclip size={20} />
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
                    {msg.role === 'assistant' ? (
                      renderMessageContent(msg.content)
                    ) : (
                      <div className="message-content">{msg.content}</div>
                    )}
                    <div className="message-actions">
                      {msg.role === 'assistant' && (
                        <button 
                          className="play-button"
                          onClick={() => handlePlayAudio(msg.content, idx)}
                          title="Play message"
                        >
                          {playingIndex === idx ? (
                            <VolumeX size={16} />
                          ) : (
                            <Volume2 size={16} />
                          )}
                        </button>
                      )}
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
      
      {/* HTML Preview Modal */}
      {showPreview && previewHtml && (
        <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>HTML Preview</h3>
              <button 
                className="preview-close-button"
                onClick={() => setShowPreview(false)}
                title="Close preview"
              >
                ×
              </button>
            </div>
            <div className="preview-modal-content">
              <iframe
                srcDoc={previewHtml}
                className="preview-iframe"
                title="HTML Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
