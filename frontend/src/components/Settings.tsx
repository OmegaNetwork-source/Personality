import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bot, Save, X, Globe } from 'lucide-react'
import './Settings.css'

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
  onSave: (userProfile: any, aiProfile: AIProfile) => void
  onClose: () => void
}

export default function Settings({ userProfile, aiProfile, personalities, onSave, onClose }: Props) {
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

  const selectedPersonality = personalities.find(p => p.id === aiForm.personality)
  const availableLanguages = selectedPersonality?.language?.primary || []
  const hasLanguages = availableLanguages.length > 0

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

        <div className="settings-content">
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
