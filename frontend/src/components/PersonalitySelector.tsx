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
}

export default function PersonalitySelector({ personalities, selected, onSelect }: Props) {
  return (
    <div className="personality-selector">
      <div className="selector-container">
        <label className="selector-label">Personality:</label>
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
      </div>
    </div>
  )
}
