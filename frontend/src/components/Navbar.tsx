import { Link } from 'react-router-dom'
import { MessageSquare, Code, Image, Video, Moon, Sun, User, Settings } from 'lucide-react'
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
          <span className="logo-text">AI Personality Platform</span>
        </Link>
        <div className="nav-links">
          <Link to="/chat" className="nav-link">
            <MessageSquare size={20} />
            <span>Chat</span>
          </Link>
          <Link to="/code" className="nav-link">
            <Code size={20} />
            <span>Code</span>
          </Link>
          <Link to="/image" className="nav-link">
            <Image size={20} />
            <span>Image</span>
          </Link>
          <Link to="/video" className="nav-link">
            <Video size={20} />
            <span>Video</span>
          </Link>
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
