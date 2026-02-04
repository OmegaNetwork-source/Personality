import { Link } from 'react-router-dom'
import { Moon, Sun, User, Settings } from 'lucide-react'
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
          {userProfile && (
            <div className="nav-user-info">
              <User size={18} />
              <span className="nav-user-name">{userProfile.name}</span>
            </div>
          )}
          <button className="nav-link settings-button" onClick={onSettingsClick} title="Settings">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
