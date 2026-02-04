import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Globe, Sparkles, Languages } from 'lucide-react'
import './PersonalityEditor.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://hm4ztnlv0ctkie-8000.proxy.runpod.net'

interface Personality {
  id: string
  name: string
  description: string
  system_prompt: string
  traits: string[]
  language?: {
    primary: string[]
    preference?: string
    code_switching?: boolean
  }
  region?: string
  cultural_context?: {
    values?: string[]
    traditions?: string[]
    communication_style?: string
    greeting_style?: string
    cultural_references?: string[]
    emoji_usage?: string
  }
  examples?: {
    greeting?: string
    response_style?: string
  }
}

interface Props {
  personalities: Personality[]
  onUpdate: () => void
}

export default function PersonalityEditor({ personalities, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Personality>>({
    name: '',
    description: '',
    system_prompt: '',
    traits: [],
    language: {
      primary: ['English'],
      code_switching: false
    }
  })

  const defaultPersonalities = ['default', 'developer', 'creative', 'analytical', 'casual',
    'asian', 'middle_eastern', 'european', 'latin_american', 'african']

  const isDefault = (id: string) => defaultPersonalities.includes(id)

  const startEdit = (personality: Personality) => {
    setFormData({
      ...personality,
      language: personality.language || { primary: ['English'], code_switching: false },
      cultural_context: personality.cultural_context || {},
      examples: personality.examples || {}
    })
    setEditingId(personality.id)
    setShowCreateForm(true)
  }

  const startCreate = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      traits: [],
      language: {
        primary: ['English'],
        code_switching: false
      },
      cultural_context: {},
      examples: {}
    })
    setEditingId(null)
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setShowCreateForm(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const personalityData: Personality = {
        id: editingId || formData.name?.toLowerCase().replace(/\s+/g, '_') || 'custom',
        name: formData.name || '',
        description: formData.description || '',
        system_prompt: formData.system_prompt || '',
        traits: formData.traits || [],
        ...(formData.language && { language: formData.language }),
        ...(formData.region && { region: formData.region }),
        ...(formData.cultural_context && Object.keys(formData.cultural_context).length > 0 && { cultural_context: formData.cultural_context }),
        ...(formData.examples && Object.keys(formData.examples).length > 0 && { examples: formData.examples })
      }

      const url = editingId 
        ? `${API_URL}/personalities/${editingId}`
        : `${API_URL}/personalities`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalityData)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      await onUpdate()
      cancelEdit()
      alert(editingId ? 'Personality updated!' : 'Personality created!')
    } catch (error: any) {
      console.error('Failed to save personality:', error)
      alert(`Failed to save: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete personality "${personalities.find(p => p.id === id)?.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/personalities/${id}`, {
        method: 'DELETE',
        headers: {
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      await onUpdate()
      alert('Personality deleted!')
    } catch (error: any) {
      console.error('Failed to delete personality:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const addLanguage = () => {
    const lang = prompt('Enter language name:')
    if (lang && formData.language) {
      setFormData({
        ...formData,
        language: {
          ...formData.language,
          primary: [...(formData.language.primary || []), lang]
        }
      })
    }
  }

  const removeLanguage = (lang: string) => {
    if (formData.language) {
      setFormData({
        ...formData,
        language: {
          ...formData.language,
          primary: formData.language.primary?.filter(l => l !== lang) || []
        }
      })
    }
  }

  const addTrait = () => {
    const trait = prompt('Enter trait:')
    if (trait) {
      setFormData({
        ...formData,
        traits: [...(formData.traits || []), trait]
      })
    }
  }

  const removeTrait = (trait: string) => {
    setFormData({
      ...formData,
      traits: formData.traits?.filter(t => t !== trait) || []
    })
  }

  const addArrayItem = (field: 'values' | 'traditions' | 'cultural_references', value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        cultural_context: {
          ...formData.cultural_context,
          [field]: [...(formData.cultural_context?.[field] || []), value.trim()]
        }
      })
    }
  }

  const removeArrayItem = (field: 'values' | 'traditions' | 'cultural_references', index: number) => {
    const items = formData.cultural_context?.[field] || []
    setFormData({
      ...formData,
      cultural_context: {
        ...formData.cultural_context,
        [field]: items.filter((_, i) => i !== index)
      }
    })
  }

  if (showCreateForm) {
    return (
      <div className="personality-editor-form">
        <div className="editor-header">
          <h3>{editingId ? 'Edit Personality' : 'Create New Personality'}</h3>
          <button className="btn-icon" onClick={cancelEdit}>
            <X size={20} />
          </button>
        </div>

        <div className="editor-content">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Friendly Mentor"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description of this personality"
            />
          </div>

          <div className="form-group">
            <label>System Prompt *</label>
            <textarea
              value={formData.system_prompt || ''}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Describe how this AI should behave, speak, and respond..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label>Traits</label>
            <div className="tags-container">
              {formData.traits?.map(trait => (
                <span key={trait} className="tag">
                  {trait}
                  <button onClick={() => removeTrait(trait)}>×</button>
                </span>
              ))}
              <button className="btn-add-tag" onClick={addTrait}>+ Add Trait</button>
            </div>
          </div>

          <div className="form-section">
            <h4><Languages size={16} /> Language Settings</h4>
            <div className="form-group">
              <label>Primary Languages</label>
              <div className="tags-container">
                {formData.language?.primary?.map(lang => (
                  <span key={lang} className="tag">
                    {lang}
                    <button onClick={() => removeLanguage(lang)}>×</button>
                  </span>
                ))}
                <button className="btn-add-tag" onClick={addLanguage}>+ Add Language</button>
              </div>
            </div>
            <div className="form-group">
              <label>Language Preference</label>
              <textarea
                value={formData.language?.preference || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  language: { ...formData.language, preference: e.target.value }
                })}
                placeholder="Describe how this personality uses languages..."
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.language?.code_switching || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    language: { ...formData.language, code_switching: e.target.checked }
                  })}
                />
                Allow code-switching between languages
              </label>
            </div>
          </div>

          <div className="form-section">
            <h4><Sparkles size={16} /> Cultural Context (Optional)</h4>
            <div className="form-group">
              <label>Region</label>
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., East Asia, Europe"
              />
            </div>
            <div className="form-group">
              <label>Values</label>
              {formData.cultural_context?.values?.map((value, i) => (
                <div key={i} className="array-item">
                  <input type="text" value={value} readOnly />
                  <button onClick={() => removeArrayItem('values', i)}>×</button>
                </div>
              ))}
              <button className="btn-add-item" onClick={() => {
                const value = prompt('Enter a value:')
                if (value) addArrayItem('values', value)
              }}>+ Add Value</button>
            </div>
            <div className="form-group">
              <label>Communication Style</label>
              <textarea
                value={formData.cultural_context?.communication_style || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  cultural_context: { ...formData.cultural_context, communication_style: e.target.value }
                })}
                placeholder="Describe how this personality communicates..."
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>Greeting Style</label>
              <input
                type="text"
                value={formData.cultural_context?.greeting_style || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  cultural_context: { ...formData.cultural_context, greeting_style: e.target.value }
                })}
                placeholder="How this personality greets others"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Examples (Optional)</h4>
            <div className="form-group">
              <label>Example Greeting</label>
              <input
                type="text"
                value={formData.examples?.greeting || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  examples: { ...formData.examples, greeting: e.target.value }
                })}
                placeholder="Example of how this personality greets"
              />
            </div>
            <div className="form-group">
              <label>Example Response Style</label>
              <textarea
                value={formData.examples?.response_style || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  examples: { ...formData.examples, response_style: e.target.value }
                })}
                placeholder="Example of how this personality responds"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={18} />
            {editingId ? 'Update' : 'Create'} Personality
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="personality-editor">
      <div className="editor-header">
        <h3>Manage Personalities</h3>
        <button className="btn-primary" onClick={startCreate}>
          <Plus size={18} />
          Create New
        </button>
      </div>

      <div className="personalities-list">
        {personalities.map(personality => (
          <div key={personality.id} className="personality-card">
            <div className="card-header">
              <div>
                <h4>{personality.name}</h4>
                <p>{personality.description}</p>
              </div>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => startEdit(personality)} title="Edit">
                  <Edit2 size={18} />
                </button>
                {!isDefault(personality.id) && (
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(personality.id)} title="Delete">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            <div className="card-details">
              {personality.language?.primary && (
                <span className="badge">
                  <Globe size={14} />
                  {personality.language.primary.join(', ')}
                </span>
              )}
              {personality.traits && personality.traits.length > 0 && (
                <span className="badge">
                  {personality.traits.slice(0, 3).join(', ')}
                  {personality.traits.length > 3 && ` +${personality.traits.length - 3}`}
                </span>
              )}
              {isDefault(personality.id) && (
                <span className="badge badge-default">Default</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
