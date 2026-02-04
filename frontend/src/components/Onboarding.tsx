import { useState } from 'react'
import { User, Sparkles } from 'lucide-react'
import './Onboarding.css'

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
  onComplete: (userProfile: UserProfile, aiProfile: AIProfile) => void
  personalities: Array<{ id: string; name: string; description: string }>
}

export default function Onboarding({ onComplete, personalities }: Props) {
  const [step, setStep] = useState(1)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    ethnicity: '',
    gender: '',
    age: '',
    interests: '',
    background: ''
  })
  const [aiProfile, setAIProfile] = useState<AIProfile>({
    personality: 'default',
    ethnicity: '',
    gender: '',
    name: '',
    traits: []
  })

  const ethnicities = [
    'African', 'Asian', 'Caucasian', 'Hispanic', 'Middle Eastern', 
    'Native American', 'Pacific Islander', 'Mixed', 'Prefer not to say', 'Other'
  ]

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']

  const handleNext = () => {
    if (step === 1) {
      if (userProfile.name && userProfile.ethnicity && userProfile.gender) {
        setStep(2)
      }
    } else if (step === 2) {
      if (aiProfile.personality && aiProfile.ethnicity && aiProfile.gender) {
        onComplete(userProfile, aiProfile)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          {step === 1 ? (
            <>
              <User size={32} />
              <h2>Tell Us About Yourself</h2>
              <p>Help us personalize your AI experience</p>
            </>
          ) : (
            <>
              <Sparkles size={32} />
              <h2>Customize Your AI</h2>
              <p>Choose your AI companion's personality and appearance</p>
            </>
          )}
        </div>

        {step === 1 && (
          <div className="onboarding-form">
            <div className="form-group">
              <label>Your Name *</label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Ethnicity *</label>
              <select
                value={userProfile.ethnicity}
                onChange={(e) => setUserProfile({ ...userProfile, ethnicity: e.target.value })}
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
                value={userProfile.gender}
                onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
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
                value={userProfile.age}
                onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label>Interests</label>
              <textarea
                value={userProfile.interests}
                onChange={(e) => setUserProfile({ ...userProfile, interests: e.target.value })}
                placeholder="What are you interested in? (optional)"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Background</label>
              <textarea
                value={userProfile.background}
                onChange={(e) => setUserProfile({ ...userProfile, background: e.target.value })}
                placeholder="Tell us about yourself (optional)"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-form">
            <div className="form-group">
              <label>AI Personality *</label>
              <select
                value={aiProfile.personality}
                onChange={(e) => setAIProfile({ ...aiProfile, personality: e.target.value })}
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
                value={aiProfile.name}
                onChange={(e) => setAIProfile({ ...aiProfile, name: e.target.value })}
                placeholder="Give your AI a name (optional)"
              />
            </div>

            <div className="form-group">
              <label>AI Ethnicity *</label>
              <select
                value={aiProfile.ethnicity}
                onChange={(e) => setAIProfile({ ...aiProfile, ethnicity: e.target.value })}
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
                value={aiProfile.gender}
                onChange={(e) => setAIProfile({ ...aiProfile, gender: e.target.value })}
              >
                <option value="">Select AI gender</option>
                {genders.map(gen => (
                  <option key={gen} value={gen}>{gen}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Additional Traits</label>
              <div className="traits-grid">
                {['Friendly', 'Professional', 'Creative', 'Analytical', 'Humorous', 'Supportive', 'Direct', 'Empathetic'].map(trait => (
                  <label key={trait} className="trait-checkbox">
                    <input
                      type="checkbox"
                      checked={aiProfile.traits.includes(trait)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAIProfile({ ...aiProfile, traits: [...aiProfile.traits, trait] })
                        } else {
                          setAIProfile({ ...aiProfile, traits: aiProfile.traits.filter(t => t !== trait) })
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

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="btn-primary" onClick={handleNext}>
            {step === 2 ? 'Complete Setup' : 'Next'}
          </button>
        </div>

        <div className="onboarding-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>
      </div>
    </div>
  )
}
