import { Link } from 'react-router-dom'
import { Moon, Sun, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import './Navbar.css'

interface Props {
  userProfile?: any
  aiProfile?: any
  onSettingsClick?: () => void
}

export default function Navbar({ userProfile, aiProfile, onSettingsClick }: Props) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-text">CharacterOS</span>
        </Link>
        <div className="nav-links">
          <Link to="/ai-to-ai" className="nav-link">
            AI vs AI
          </Link>
          <button className="settings-button" onClick={onSettingsClick} title="Settings">
            <Settings size={20} />
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
