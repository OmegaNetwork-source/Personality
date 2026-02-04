import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bot, Save, X } from 'lucide-react'
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
}

interface Props {
  userProfile: UserProfile | null
  aiProfile: AIProfile | null
  personalities: Array<{ id: string; name: string; description: string }>
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
    traits: aiProfile?.traits || []
  })

  const ethnicities = [
    'African', 'Asian', 'Caucasian', 'Hispanic', 'Middle Eastern', 
    'Native American', 'Pacific Islander', 'Mixed', 'Prefer not to say', 'Other'
  ]

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']

  const handleSave = () => {
    if (userForm.name && userForm.ethnicity && userForm.gender && 
        aiForm.personality && aiForm.ethnicity && aiForm.gender) {
      onSave(userForm, aiForm)
      onClose()
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={24} />
            <h2>Settings</h2>
          </div>
          <button className="settings-close" onClick={onClose}>
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
                <h3>Personal Information</h3>
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

              <div className="form-section">
                <h3>Additional Information</h3>
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
                <h3>AI Configuration</h3>
                <div className="form-group">
                  <label>Personality Type *</label>
                  <select
                    value={aiForm.personality}
                    onChange={(e) => setAIForm({ ...aiForm, personality: e.target.value })}
                  >
                    {personalities.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>AI Name</label>
                  <input
                    type="text"
                    value={aiForm.name}
                    onChange={(e) => setAIForm({ ...aiForm, name: e.target.value })}
                    placeholder="Give your AI a name (optional)"
                  />
                </div>

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

              <div className="form-section">
                <h3>Personality Traits</h3>
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
