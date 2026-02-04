import { Link } from 'react-router-dom'
import { MessageSquare, Code, Image, Video } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🤖</span>
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
        </div>
      </div>
    </nav>
  )
}
