import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Copy, Check, Eye, Volume2, VolumeX } from 'lucide-react'
import './Chat.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Props {
  personality: string
  userProfile?: any
  aiProfile?: any
}

export default function Chat({ personality, userProfile, aiProfile }: Props) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; image?: string; video?: string; type?: 'text' | 'image' | 'video' }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showPersonalityVideo, setShowPersonalityVideo] = useState(false)
  const [personalityVideoSrc, setPersonalityVideoSrc] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const personalityVideoRef = useRef<HTMLVideoElement>(null)
  const previousPersonalityRef = useRef<string>(personality)

  // Get profile picture path for personality
  const getPersonalityAvatar = (personalityId: string): string => {
    // Try to load personality-specific avatar, fallback to default
    return `/avatars/${personalityId}.png`
  }

  // Get personality display name
  const getPersonalityName = (personalityId: string): string => {
    const nameMap: { [key: string]: string } = {
      'slave': 'Slave',
      'airdrop_farmer': 'Airdrop Farmer',
      'vietnam_vet': 'Vietnam Vet',
      'gangster': 'Gangster',
      'default': 'Default'
    }
    return nameMap[personalityId] || personalityId
  }

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

  // Handle personality video playback
  useEffect(() => {
    // Check if personality changed to one that needs a video
    if (personality !== previousPersonalityRef.current) {
      previousPersonalityRef.current = personality

      // Check if this personality needs a video
      let videoPath: string | null = null
      if (personality === 'slave') {
        videoPath = '/videos/slave.mov'
      } else if (personality === 'airdrop_farmer') {
        videoPath = '/videos/airdrop.mov'
      } else if (personality === 'vietnam_vet') {
        videoPath = '/videos/vet.mov'
      } else if (personality === 'gangster') {
        videoPath = '/videos/gangster.mov'
      }

      if (videoPath) {
        setPersonalityVideoSrc(videoPath)
        setShowPersonalityVideo(true)
        // Clear messages when showing video
        setMessages([])
      }
    }
  }, [personality])

  const handlePersonalityVideoEnd = () => {
    setShowPersonalityVideo(false)
    setPersonalityVideoSrc(null)
    // Video ended, return to chat
  }

  // Ensure video plays when it's shown
  useEffect(() => {
    if (showPersonalityVideo && personalityVideoRef.current) {
      const video = personalityVideoRef.current
      // Reset video to start
      video.currentTime = 0
      // Try to play
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully')
          })
          .catch((error) => {
            console.error('Error playing video:', error)
            // If autoplay fails, try unmuting and playing again
            video.muted = true
            video.play().catch(err => {
              console.error('Video play failed even with muted:', err)
            })
          })
      }
    }
  }, [showPersonalityVideo, personalityVideoSrc])

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

  // Detect if message contains image or video generation request
  const detectGenerationRequest = (message: string): { type: 'image' | 'video' | null; prompt: string } => {
    const lowerMessage = message.toLowerCase()

    // Image generation keywords
    const imageKeywords = ['generate image', 'create image', 'make image', 'draw image', 'image of', 'picture of', 'generate a picture', 'create a picture', 'make a picture', 'draw a picture', 'show me an image', 'show me a picture', 'generate image', 'create image', 'make image', 'draw image']

    // Video generation keywords
    const videoKeywords = ['generate video', 'create video', 'make video', 'video of', 'generate a video', 'create a video', 'make a video', 'show me a video', 'generate video', 'create video', 'make video']

    // Check for image request
    for (const keyword of imageKeywords) {
      if (lowerMessage.includes(keyword)) {
        // Extract prompt (everything after the keyword)
        const keywordIndex = lowerMessage.indexOf(keyword)
        let prompt = message.substring(keywordIndex + keyword.length).trim()

        // If prompt is empty, try to extract from context
        if (!prompt) {
          // Try to find a description after common phrases
          const descriptionPatterns = [
            /(?:of|showing|with|depicting|featuring)\s+(.+)/i,
            /(?:a|an)\s+(.+?)(?:\.|$)/i
          ]
          for (const pattern of descriptionPatterns) {
            const match = message.match(pattern)
            if (match && match[1]) {
              prompt = match[1].trim()
              break
            }
          }
        }

        // If still no prompt, use the whole message
        if (!prompt) {
          prompt = message.replace(new RegExp(keyword, 'gi'), '').trim()
        }

        return { type: 'image', prompt: prompt || 'a beautiful image' }
      }
    }

    // Check for video request
    for (const keyword of videoKeywords) {
      if (lowerMessage.includes(keyword)) {
        // Extract prompt (everything after the keyword)
        const keywordIndex = lowerMessage.indexOf(keyword)
        let prompt = message.substring(keywordIndex + keyword.length).trim()

        // If prompt is empty, try to extract from context
        if (!prompt) {
          // Try to find a description after common phrases
          const descriptionPatterns = [
            /(?:of|showing|with|depicting|featuring)\s+(.+)/i,
            /(?:a|an)\s+(.+?)(?:\.|$)/i
          ]
          for (const pattern of descriptionPatterns) {
            const match = message.match(pattern)
            if (match && match[1]) {
              prompt = match[1].trim()
              break
            }
          }
        }

        // If still no prompt, use the whole message
        if (!prompt) {
          prompt = message.replace(new RegExp(keyword, 'gi'), '').trim()
        }

        return { type: 'video', prompt: prompt || 'a beautiful video' }
      }
    }

    return { type: null, prompt: '' }
  }

  const generateImage = async (prompt: string) => {
    try {
      const response = await fetch(`${API_URL}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: '',
          width: 1024,
          height: 1024
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (data.image) {
        return `data:image/png;base64,${data.image}`
      } else {
        throw new Error('No image in response')
      }
    } catch (error: any) {
      throw new Error(`Image generation failed: ${error.message}`)
    }
  }

  const generateVideo = async (prompt: string) => {
    try {
      const response = await fetch(`${API_URL}/api/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          prompt,
          duration: 4
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (data.video) {
        return `data:video/mp4;base64,${data.video}`
      } else {
        throw new Error('No video in response')
      }
    } catch (error: any) {
      throw new Error(`Video generation failed: ${error.message}`)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Check if this is an image or video generation request
      const genRequest = detectGenerationRequest(userMessage)

      if (genRequest.type === 'image') {
        try {
          const imageData = await generateImage(genRequest.prompt)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Here's the image you requested: "${genRequest.prompt}"`,
            image: imageData,
            type: 'image'
          }])
        } catch (error: any) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sorry, I couldn't generate the image. ${error.message}`
          }])
        }
        setLoading(false)
        return
      }

      if (genRequest.type === 'video') {
        try {
          const videoData = await generateVideo(genRequest.prompt)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Here's the video you requested: "${genRequest.prompt}"`,
            video: videoData,
            type: 'video'
          }])
        } catch (error: any) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Sorry, I couldn't generate the video. ${error.message}`
          }])
        }
        setLoading(false)
        return
      }

      // Regular chat message - Prepare for streaming
      // Build context
      const context = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Use AbortController for user cancellation
      const controller = new AbortController()

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
          context: context,
          stream: true // ENABLE STREAMING
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Backend error (${response.status})`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // STREAMING READER LOGIC
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullMessage = ''
      let isFirstChunk = true

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        const lines = buffer.split('\n')

        // Process all complete lines
        buffer = lines.pop() || '' // Keep the last partial line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

          try {
            const jsonStr = trimmedLine.substring(6) // Remove "data: " prefix
            if (jsonStr === '[DONE]') continue

            const data = JSON.parse(jsonStr)

            // Extract content from various possible formats
            let token = ''
            if (data.message?.content) {
              token = data.message.content
            } else if (data.response) {
              token = data.response
            } else if (data.content) {
              token = data.content
            }

            if (token) {
              fullMessage += token

              if (isFirstChunk) {
                // FIRST TOKEN: Hide loading, create message
                setLoading(false)
                setMessages(prev => [...prev, { role: 'assistant', content: fullMessage, type: 'text' }])
                isFirstChunk = false
              } else {
                // SUBSEQUENT TOKENS: Update last message
                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastMsg = newMessages[newMessages.length - 1]
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content = fullMessage
                  }
                  return newMessages
                })
              }
            }
          } catch (e) {
            console.warn('Error parsing stream line:', e)
          }
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      let errorMessage = 'Error: Failed to get response.'

      // If we haven't started streaming yet, create a new error message
      // If we HAVE started streaming, append error to it

      setMessages(prev => {
        const newMessages = [...prev]
        // Check if last message is assistant
        const lastMsg = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null

        if (lastMsg && lastMsg.role === 'assistant' && !loading) {
          // We were already streaming, append error
          lastMsg.content += `\n\n[Network Error: ${error.message}]`
          return newMessages
        } else {
          // We failed before streaming started
          return [...newMessages, { role: 'assistant', content: errorMessage }]
        }
      })
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
                  {msg.role === 'assistant' && (
                    <div className="message-avatar">
                      <img
                        src={getPersonalityAvatar(personality)}
                        alt={personality}
                        className="avatar-image"
                        onError={(e) => {
                          // Fallback to default avatar if personality-specific one doesn't exist
                          const target = e.target as HTMLImageElement
                          target.src = '/avatars/default.png'
                        }}
                      />
                    </div>
                  )}
                  <div className="message-content-wrapper">
                    {msg.role === 'assistant' ? (
                      <>
                        {msg.type === 'image' && msg.image && (
                          <div className="generated-image-container">
                            <img src={msg.image} alt="Generated" className="generated-image" />
                          </div>
                        )}
                        {msg.type === 'video' && msg.video && (
                          <div className="generated-video-container">
                            <video src={msg.video} controls className="generated-video" />
                          </div>
                        )}
                        {msg.content && renderMessageContent(msg.content)}
                      </>
                    ) : (
                      <div className="message-content">{msg.content}</div>
                    )}
                    <div className="message-actions">
                      {msg.role === 'assistant' && msg.content && (
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
                        onClick={() => handleCopy(msg.content || '', idx)}
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
                  <div className="message-avatar">
                    <img
                      src={getPersonalityAvatar(personality)}
                      alt={personality}
                      className="avatar-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/avatars/default.png'
                      }}
                    />
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
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

      {/* Personality Video Overlay */}
      {showPersonalityVideo && personalityVideoSrc && (
        <div className="personality-video-overlay">
          <div className="personality-video-container">
            <h2 className="personality-video-title">{getPersonalityName(personality)}</h2>
            <div className="personality-video-wrapper">
              <video
                ref={personalityVideoRef}
                src={personalityVideoSrc}
                autoPlay
                muted
                playsInline
                className="personality-video"
                onEnded={handlePersonalityVideoEnd}
                onLoadedData={() => {
                  // Ensure video plays when loaded
                  if (personalityVideoRef.current) {
                    personalityVideoRef.current.play().catch(err => {
                      console.error('Video play error:', err)
                    })
                  }
                }}
                onError={(e) => {
                  console.error('Video playback error:', e)
                  console.error('Video src:', personalityVideoSrc)
                  // If video fails to load, just close and return to chat
                  handlePersonalityVideoEnd()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
