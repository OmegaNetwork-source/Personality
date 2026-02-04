import { useState } from 'react'
import { Video, Upload, Download } from 'lucide-react'
import './VideoGen.css'

export default function VideoGen() {
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'text' | 'image'>('text')
  const [duration, setDuration] = useState(4)
  const [generatedVideo, setGeneratedVideo] = useState('')
  const [loading, setLoading] = useState(false)

  const generateVideo = async () => {
    setLoading(true)
    setGeneratedVideo('')

    try {
      let response

      const API_URL = import.meta.env.VITE_API_URL || 'https://jarrett-balloonlike-julietta.ngrok-free.dev'
      
      if (mode === 'text' && prompt.trim()) {
        response = await fetch(`${API_URL}/api/video/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            duration
          })
        })
      } else if (mode === 'image' && imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('duration', duration.toString())

        response = await fetch(`${API_URL}/api/video/generate-from-image`, {
          method: 'POST',
          body: formData
        })
      } else {
        alert('Please provide either a text prompt or upload an image')
        setLoading(false)
        return
      }

      const data = await response.json()
      if (data.video) {
        setGeneratedVideo(`data:video/mp4;base64,${data.video}`)
      }
    } catch (error) {
      alert('Error generating video. Make sure the backend and video service are running.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  return (
    <div className="video-gen">
      <div className="video-container">
        <div className="video-header">
          <Video size={24} />
          <h2>Video Generation</h2>
          <span className="no-filters-badge">No Filters - Complete Freedom</span>
        </div>

        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            Text to Video
          </button>
          <button
            className={`mode-button ${mode === 'image' ? 'active' : ''}`}
            onClick={() => setMode('image')}
          >
            Image to Video
          </button>
        </div>

        <div className="video-controls">
          {mode === 'text' ? (
            <div className="control-group">
              <label>Prompt</label>
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                rows={4}
              />
            </div>
          ) : (
            <div className="control-group">
              <label>Upload Image</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="file-label">
                  <Upload size={20} />
                  {imageFile ? imageFile.name : 'Choose Image File'}
                </label>
              </div>
            </div>
          )}

          <div className="duration-control">
            <label>Duration (seconds)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 4)}
              min={1}
              max={10}
            />
          </div>

          <button
            className="generate-button"
            onClick={generateVideo}
            disabled={loading || (mode === 'text' && !prompt.trim()) || (mode === 'image' && !imageFile)}
          >
            {loading ? 'Generating Video... (This may take a while)' : 'Generate Video'}
          </button>
        </div>

        {generatedVideo && (
          <div className="video-result">
            <div className="result-header">
              <h3>Generated Video</h3>
            </div>
            <video src={generatedVideo} controls className="generated-video" />
          </div>
        )}
      </div>
    </div>
  )
}
