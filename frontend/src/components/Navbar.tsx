import { Link } from 'react-router-dom'
import { Moon, Sun, Bot } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import './Navbar.css'

interface Props {
  userProfile?: any
  aiProfile?: any
  onSettingsClick?: () => void
}

export default function Navbar({ }: Props) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Bot size={24} />
          <span className="logo-text">CharacterOS</span>
        </Link>
        <div className="nav-links">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
