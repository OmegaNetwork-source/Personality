import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bot, Save, X, Globe, Sparkles } from 'lucide-react'
import './Settings.css'

interface UserProfile {
  name: string
  ethnicity: string
  gender: string
  age: string
  interests: string
  background: string
}

interface AIProfile {
  personality: string
  ethnicity: string
  gender: string
  name: string
  traits: string[]
  preferredLanguage?: string
}

interface Props {
  userProfile: UserProfile | null
  aiProfile: AIProfile | null
  personalities: Array<{ 
    id: string
    name: string
    description: string
    language?: {
      primary: string[]
      preference?: string
      code_switching?: boolean
    }
  }>
  onSave: (userProfile: UserProfile, aiProfile: AIProfile) => void
  onClose: () => void
}

export default function Settings({ userProfile, aiProfile, personalities, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'user' | 'ai'>('user')
  const [userForm, setUserForm] = useState<UserProfile>({
    name: userProfile?.name || '',
    ethnicity: userProfile?.ethnicity || '',
    gender: userProfile?.gender || '',
    age: userProfile?.age || '',
    interests: userProfile?.interests || '',
    background: userProfile?.background || ''
  })
  const [aiForm, setAIForm] = useState<AIProfile>({
    personality: aiProfile?.personality || 'default',
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
  }, [personalities])

  const handleSave = () => {
    if (userForm.name && userForm.ethnicity && userForm.gender && 
        aiForm.personality && aiForm.ethnicity && aiForm.gender) {
      onSave(userForm, aiForm)
      onClose()
    }
  }

  const selectedPersonality = personalities.find(p => p.id === aiForm.personality)
  const availableLanguages = selectedPersonality?.language?.primary || []
  const hasLanguages = availableLanguages.length > 0

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={24} />
            <h2>Settings</h2>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <User size={18} />
            <span>User Profile</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Bot size={18} />
            <span>AI Personality</span>
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'user' && (
            <div className="settings-form">
              <div className="form-section">
                <h3>
                  <User size={18} />
                  Personal Information
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="text"
                      value={userForm.age}
                      onChange={(e) => setUserForm({ ...userForm, age: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ethnicity *</label>
                    <select
                      value={userForm.ethnicity}
                      onChange={(e) => setUserForm({ ...userForm, ethnicity: e.target.value })}
                    >
                      <option value="">Select ethnicity</option>
                      {ethnicities.map(eth => (
                        <option key={eth} value={eth}>{eth}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={userForm.gender}
                      onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })}
                    >
                      <option value="">Select gender</option>
                      {genders.map(gen => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  <Sparkles size={18} />
                  Additional Information
                </h3>
                <div className="form-group">
                  <label>Interests</label>
                  <textarea
                    value={userForm.interests}
                    onChange={(e) => setUserForm({ ...userForm, interests: e.target.value })}
                    placeholder="What are you interested in? (optional)"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Background</label>
                  <textarea
                    value={userForm.background}
                    onChange={(e) => setUserForm({ ...userForm, background: e.target.value })}
                    placeholder="Tell us about yourself (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
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
                        {personalities.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {p.description}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {personalities.length === 0 && (
                    <small className="form-hint">Make sure the backend is running and accessible.</small>
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

              <div className="form-section">
                <h3>
                  <Sparkles size={18} />
                  Personality Traits
                </h3>
                <div className="traits-grid">
                  {['Friendly', 'Professional', 'Creative', 'Analytical', 'Humorous', 'Supportive', 'Direct', 'Empathetic'].map(trait => (
                    <label key={trait} className="trait-checkbox">
                      <input
                        type="checkbox"
                        checked={aiForm.traits.includes(trait)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAIForm({ ...aiForm, traits: [...aiForm.traits, trait] })
                          } else {
                            setAIForm({ ...aiForm, traits: aiForm.traits.filter(t => t !== trait) })
                          }
                        }}
                      />
                      <span>{trait}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}
