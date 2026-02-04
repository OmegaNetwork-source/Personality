import './PersonalitySelector.css'

interface Personality {
  id: string
  name: string
  description: string
}

interface Props {
  personalities: Personality[]
  selected: string
  onSelect: (id: string) => void
  aiProfile?: any
}

export default function PersonalitySelector({ personalities, selected, onSelect, aiProfile }: Props) {
  return (
    <div className="personality-selector">
      <div className="selector-container">
        <label className="selector-label">AI Personality:</label>
        <select
          className="selector-dropdown"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
        >
          {personalities.map((personality) => (
            <option key={personality.id} value={personality.id}>
              {personality.name} - {personality.description}
            </option>
          ))}
        </select>
        {aiProfile && (
          <div className="ai-info">
            <span className="ai-name">{aiProfile.name || 'Your AI'}</span>
            {aiProfile.ethnicity && (
              <span className="ai-details">{aiProfile.ethnicity} • {aiProfile.gender}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
