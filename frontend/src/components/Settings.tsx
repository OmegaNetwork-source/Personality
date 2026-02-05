import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bot, Save, X, Globe, Edit3, MessageCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import PersonalityEditor from './PersonalityEditor'
import './Settings.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AIProfile {
  personality: string
  ethnicity: string
  gender: string
  name: string
  traits: string[]
  preferredLanguage?: string
}

interface Props {
  userProfile: any | null
  aiProfile: AIProfile | null
  personalities: any[]
  onSave: (userProfile: any, aiProfile: AIProfile) => void
  onClose: () => void
  onPersonalityUpdate?: () => void
}

export default function Settings({ userProfile, aiProfile, personalities, onSave, onClose, onPersonalityUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'config' | 'editor'>('config')
  const [aiForm, setAIForm] = useState<AIProfile>({
    personality: aiProfile?.personality || 'vietnam_vet',
    ethnicity: aiProfile?.ethnicity || '',
    gender: aiProfile?.gender || '',
    name: aiProfile?.name || '',
    traits: aiProfile?.traits || [],
    preferredLanguage: aiProfile?.preferredLanguage || ''
  })

  const ethnicities = [
    'African', 'Asian', 'Caucasian', 'Hispanic', 'Middle Eastern', 
    'Native American', 'Pacific Islander', 'Mixed', 'Prefer not to say', 'Other'
  ]

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']

  useEffect(() => {
    // Ensure we have a valid personality selected
    if (personalities.length > 0 && !personalities.find(p => p.id === aiForm.personality)) {
      setAIForm({ ...aiForm, personality: personalities[0].id })
    }
    // Debug logging
    console.log('🔧 Settings - Personalities received:', personalities.length)
    if (personalities.length === 0) {
      console.warn('⚠️ No personalities loaded! Check console for fetch errors.')
    }
  }, [personalities])

  const handleSave = () => {
    if (aiForm.personality && aiForm.ethnicity && aiForm.gender) {
      onSave(userProfile, aiForm)
      onClose()
    }
  }

  const handlePersonalityUpdate = async () => {
    if (onPersonalityUpdate) {
      onPersonalityUpdate()
    } else {
      // Fallback: reload page
      window.location.reload()
    }
  }

  const selectedPersonality = personalities.find(p => p.id === aiForm.personality)
  const availableLanguages = selectedPersonality?.language?.primary || []
  const hasLanguages = availableLanguages.length > 0

  // Bot Configuration Component
  function BotConfiguration() {
    const [botStatus, setBotStatus] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [tokens, setTokens] = useState({
      discord: '',
      telegram: '',
      whatsapp: ''
    })
    
    const userId = userProfile?.id || `user_${Date.now()}`
    
    useEffect(() => {
      fetchBotStatus()
    }, [])
    
    const fetchBotStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bots/status/${userId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        const data = await response.json()
        setBotStatus(data)
      } catch (error) {
        console.error('Failed to fetch bot status:', error)
      }
    }
    
    const handleConnect = async (botType: string) => {
      setLoading(true)
      try {
        const token = tokens[botType as keyof typeof tokens]
        if (!token) {
          alert('Please enter a token')
          return
        }
        
        const response = await fetch(`${API_URL}/api/bots/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            bot_type: botType,
            token: token,
            user_id: userId
          })
        })
        
        const result = await response.json()
        if (result.status === 'success') {
          alert(`${botType} bot connected successfully!`)
          setTokens({ ...tokens, [botType]: '' })
          fetchBotStatus()
        } else {
          alert(`Failed to connect: ${result.message}`)
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    const handleDisconnect = async (botType: string) => {
      try {
        const response = await fetch(`${API_URL}/api/bots/disconnect/${userId}/${botType}`, {
          method: 'DELETE',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        const result = await response.json()
        if (result.status === 'success') {
          alert(`${botType} bot disconnected`)
          fetchBotStatus()
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      }
    }
    
    const botConfigs = [
      {
        type: 'discord',
        name: 'Discord',
        icon: '💬',
        instructions: [
          '1. Go to https://discord.com/developers/applications',
          '2. Click "New Application" and give it a name',
          '3. Go to "Bot" section and click "Add Bot"',
          '4. Copy the bot token',
          '5. Enable "Message Content Intent" in Privileged Gateway Intents',
          '6. Paste the token below and click Connect'
        ],
        link: 'https://discord.com/developers/applications'
      },
      {
        type: 'telegram',
        name: 'Telegram',
        icon: '✈️',
        instructions: [
          '1. Open Telegram and search for @BotFather',
          '2. Send /newbot command',
          '3. Follow the instructions to create your bot',
          '4. Copy the token BotFather gives you',
          '5. Paste the token below and click Connect'
        ],
        link: 'https://t.me/BotFather'
      },
      {
        type: 'whatsapp',
        name: 'WhatsApp',
        icon: '📱',
        instructions: [
          '1. Sign up at https://www.twilio.com/',
          '2. Get your Account SID and Auth Token',
          '3. Set up WhatsApp Sandbox or get a WhatsApp Business number',
          '4. Enter your credentials below (format: SID|TOKEN|NUMBER)',
          '5. Configure webhook URL: YOUR_API_URL/api/whatsapp/webhook'
        ],
        link: 'https://www.twilio.com/'
      }
    ]
    
    return (
      <div className="bot-configuration">
        <h3 style={{ marginBottom: '20px' }}>
          <MessageCircle size={20} />
          Connect Your Chat Bots
        </h3>
        <p style={{ marginBottom: '24px', color: '#888' }}>
          Connect your own Discord, Telegram, or WhatsApp bots to chat with your AI personalities on those platforms.
        </p>
        
        {botConfigs.map(bot => {
          const isConnected = botStatus?.status?.[bot.type] || false
          const isConfigured = botStatus?.configured?.[bot.type] || false
          
          return (
            <div key={bot.type} className="bot-card" style={{
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              background: isConnected ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{bot.icon}</span>
                    {bot.name}
                    {isConnected && <CheckCircle size={16} color="#4caf50" />}
                  </h4>
                </div>
                <a href={bot.link} target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>
                  <ExternalLink size={16} />
                </a>
              </div>
              
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#aaa' }}>
                {bot.instructions.map((step, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>{step}</div>
                ))}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="password"
                  placeholder={`Enter ${bot.name} token...`}
                  value={tokens[bot.type as keyof typeof tokens]}
                  onChange={(e) => setTokens({ ...tokens, [bot.type]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  disabled={isConnected}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isConnected ? (
                  <button
                    onClick={() => handleConnect(bot.type)}
                    disabled={loading || !tokens[bot.type as keyof typeof tokens]}
                    style={{
                      padding: '10px 20px',
                      background: '#4a9eff',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading || !tokens[bot.type as keyof typeof tokens] ? 0.5 : 1
                    }}
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDisconnect(bot.type)}
                    style={{
                      padding: '10px 20px',
                      background: '#f44336',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Disconnect
                  </button>
                )}
                {isConnected && (
                  <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={16} />
                    Connected
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Featured personalities that should appear first with highlight
  const featuredPersonalityIds = ['vietnam_vet', 'slave', 'gangster', 'serial_killer']
  
  // Sort personalities: featured first, then others
  const sortedPersonalities = [...personalities].sort((a, b) => {
    const aIndex = featuredPersonalityIds.indexOf(a.id)
    const bIndex = featuredPersonalityIds.indexOf(b.id)
    
    // If both are featured, maintain their order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    // Featured ones come first
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    // Others maintain original order
    return 0
  })

  // Group personalities by category
  const groupedPersonalities = sortedPersonalities.reduce((acc, personality) => {
    const category = personality.category || 'Standard AI'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(personality)
    return acc
  }, {} as Record<string, typeof personalities>)

  // Define category order
  const categoryOrder = ['Funny', 'Ethnic', 'Standard AI']

  // Bot Configuration Component
  function BotConfiguration() {
    const [botStatus, setBotStatus] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [tokens, setTokens] = useState({
      discord: '',
      telegram: '',
      whatsapp: ''
    })
    
    const userId = userProfile?.id || `user_${Date.now()}`
    
    useEffect(() => {
      fetchBotStatus()
    }, [])
    
    const fetchBotStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bots/status/${userId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        const data = await response.json()
        setBotStatus(data)
      } catch (error) {
        console.error('Failed to fetch bot status:', error)
      }
    }
    
    const handleConnect = async (botType: string) => {
      setLoading(true)
      try {
        const token = tokens[botType as keyof typeof tokens]
        if (!token) {
          alert('Please enter a token')
          return
        }
        
        const response = await fetch(`${API_URL}/api/bots/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            bot_type: botType,
            token: token,
            user_id: userId
          })
        })
        
        const result = await response.json()
        if (result.status === 'success') {
          alert(`${botType} bot connected successfully!`)
          setTokens({ ...tokens, [botType]: '' })
          fetchBotStatus()
        } else {
          alert(`Failed to connect: ${result.message}`)
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    const handleDisconnect = async (botType: string) => {
      try {
        const response = await fetch(`${API_URL}/api/bots/disconnect/${userId}/${botType}`, {
          method: 'DELETE',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        const result = await response.json()
        if (result.status === 'success') {
          alert(`${botType} bot disconnected`)
          fetchBotStatus()
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      }
    }
    
    const botConfigs = [
      {
        type: 'discord',
        name: 'Discord',
        icon: '💬',
        instructions: [
          '1. Go to https://discord.com/developers/applications',
          '2. Click "New Application" and give it a name',
          '3. Go to "Bot" section and click "Add Bot"',
          '4. Copy the bot token',
          '5. Enable "Message Content Intent" in Privileged Gateway Intents',
          '6. Paste the token below and click Connect'
        ],
        link: 'https://discord.com/developers/applications'
      },
      {
        type: 'telegram',
        name: 'Telegram',
        icon: '✈️',
        instructions: [
          '1. Open Telegram and search for @BotFather',
          '2. Send /newbot command',
          '3. Follow the instructions to create your bot',
          '4. Copy the token BotFather gives you',
          '5. Paste the token below and click Connect'
        ],
        link: 'https://t.me/BotFather'
      },
      {
        type: 'whatsapp',
        name: 'WhatsApp',
        icon: '📱',
        instructions: [
          '1. Sign up at https://www.twilio.com/',
          '2. Get your Account SID and Auth Token',
          '3. Set up WhatsApp Sandbox or get a WhatsApp Business number',
          '4. Enter your credentials below (format: SID|TOKEN|NUMBER)',
          '5. Configure webhook URL: YOUR_API_URL/api/whatsapp/webhook'
        ],
        link: 'https://www.twilio.com/'
      }
    ]
    
    return (
      <div className="bot-configuration">
        <h3 style={{ marginBottom: '20px' }}>
          <MessageCircle size={20} />
          Connect Your Chat Bots
        </h3>
        <p style={{ marginBottom: '24px', color: '#888' }}>
          Connect your own Discord, Telegram, or WhatsApp bots to chat with your AI personalities on those platforms.
        </p>
        
        {botConfigs.map(bot => {
          const isConnected = botStatus?.status?.[bot.type] || false
          const isConfigured = botStatus?.configured?.[bot.type] || false
          
          return (
            <div key={bot.type} className="bot-card" style={{
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              background: isConnected ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{bot.icon}</span>
                    {bot.name}
                    {isConnected && <CheckCircle size={16} color="#4caf50" />}
                  </h4>
                </div>
                <a href={bot.link} target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>
                  <ExternalLink size={16} />
                </a>
              </div>
              
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#aaa' }}>
                {bot.instructions.map((step, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>{step}</div>
                ))}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="password"
                  placeholder={`Enter ${bot.name} token...`}
                  value={tokens[bot.type as keyof typeof tokens]}
                  onChange={(e) => setTokens({ ...tokens, [bot.type]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  disabled={isConnected}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isConnected ? (
                  <button
                    onClick={() => handleConnect(bot.type)}
                    disabled={loading || !tokens[bot.type as keyof typeof tokens]}
                    style={{
                      padding: '10px 20px',
                      background: '#4a9eff',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading || !tokens[bot.type as keyof typeof tokens] ? 0.5 : 1
                    }}
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDisconnect(bot.type)}
                    style={{
                      padding: '10px 20px',
                      background: '#f44336',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Disconnect
                  </button>
                )}
                {isConnected && (
                  <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={16} />
                    Connected
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={24} />
            <h2>AI Personality Settings</h2>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Bot size={18} />
            <span>AI Configuration</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Edit3 size={18} />
            <span>Manage Personalities</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => setActiveTab('bots')}
          >
            <Globe size={18} />
            <span>Chat Bots</span>
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'editor' ? (
            <PersonalityEditor personalities={personalities} onUpdate={handlePersonalityUpdate} />
          ) : activeTab === 'bots' ? (
            <BotConfiguration />
          ) : (
          <div className="settings-form">
            <div className="form-section">
              <h3>
                <Bot size={18} />
                AI Configuration
              </h3>
              
              <div className="form-group">
                <label>Personality Type *</label>
                <select
                  value={aiForm.personality}
                  onChange={(e) => {
                    const newPersonality = e.target.value
                    const selectedPersonality = personalities.find(p => p.id === newPersonality)
                    const availableLanguages = selectedPersonality?.language?.primary || []
                    const newPreferredLanguage = availableLanguages.includes(aiForm.preferredLanguage || '')
                      ? aiForm.preferredLanguage
                      : (availableLanguages[0] || '')
                    setAIForm({ 
                      ...aiForm, 
                      personality: newPersonality,
                      preferredLanguage: newPreferredLanguage
                    })
                  }}
                >
                  {personalities.length === 0 ? (
                    <option value="">Loading personalities...</option>
                  ) : (
                    <>
                      <option value="">Select a personality</option>
                      {/* Featured personalities first */}
                      {sortedPersonalities
                        .filter(p => featuredPersonalityIds.includes(p.id))
                        .map(p => (
                          <option 
                            key={p.id} 
                            value={p.id}
                            className="featured-personality"
                          >
                            ⭐ {p.name} - {p.description}
                          </option>
                        ))}
                      {/* Separator if we have featured personalities */}
                      {sortedPersonalities.filter(p => featuredPersonalityIds.includes(p.id)).length > 0 && (
                        <option disabled>─────────────────</option>
                      )}
                      {/* Other personalities grouped by category */}
                      {categoryOrder.map(category => {
                        const categoryPersonalities = (groupedPersonalities[category] || [])
                          .filter(p => !featuredPersonalityIds.includes(p.id))
                        if (categoryPersonalities.length === 0) return null
                        return (
                          <optgroup key={category} label={category}>
                            {categoryPersonalities.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} - {p.description}
                              </option>
                            ))}
                          </optgroup>
                        )
                      })}
                    </>
                  )}
                </select>
                {personalities.length === 0 && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px' }}>
                    <small style={{ color: '#ffc107', display: 'block', marginBottom: '4px' }}>
                      ⚠️ No personalities loaded
                    </small>
                    <small className="form-hint" style={{ display: 'block', marginTop: '4px' }}>
                      Check the browser console (F12) for errors. Make sure:
                      <br />• Backend server is running
                      <br />• API URL is correct
                      <br />• CORS is configured
                    </small>
                  </div>
                )}
                {personalities.length > 0 && (
                  <small className="form-hint" style={{ color: '#4caf50' }}>
                    ✅ {personalities.length} personality{personalities.length !== 1 ? 'ies' : ''} loaded
                  </small>
                )}
              </div>

              {hasLanguages && (
                <div className="form-group">
                  <label>
                    <Globe size={16} />
                    Preferred Language
                  </label>
                  <select
                    value={aiForm.preferredLanguage || ''}
                    onChange={(e) => setAIForm({ ...aiForm, preferredLanguage: e.target.value })}
                  >
                    <option value="">Auto (use personality's default)</option>
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  {selectedPersonality?.language?.preference && (
                    <small className="form-hint">
                      {selectedPersonality.language.preference}
                    </small>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>AI Name</label>
                  <input
                    type="text"
                    value={aiForm.name}
                    onChange={(e) => setAIForm({ ...aiForm, name: e.target.value })}
                    placeholder="Give your AI a name (optional)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>AI Ethnicity *</label>
                  <select
                    value={aiForm.ethnicity}
                    onChange={(e) => setAIForm({ ...aiForm, ethnicity: e.target.value })}
                  >
                    <option value="">Select AI ethnicity</option>
                    {ethnicities.map(eth => (
                      <option key={eth} value={eth}>{eth}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>AI Gender *</label>
                  <select
                    value={aiForm.gender}
                    onChange={(e) => setAIForm({ ...aiForm, gender: e.target.value })}
                  >
                    <option value="">Select AI gender</option>
                    {genders.map(gen => (
                      <option key={gen} value={gen}>{gen}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {activeTab === 'config' && (
          <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
        )}
        {activeTab === 'bots' && (
          <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
