import { useState } from 'react'
import { Image as ImageIcon, Download } from 'lucide-react'
import './ImageGen.css'

export default function ImageGen() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [generatedImage, setGeneratedImage] = useState('')
  const [loading, setLoading] = useState(false)

  const generateImage = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setGeneratedImage('')

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://hm4ztnlv0ctkie-8000.proxy.runpod.net'
      const response = await fetch(`${API_URL}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          width,
          height
        })
      })

      const data = await response.json()
      if (data.image) {
        setGeneratedImage(`data:image/png;base64,${data.image}`)
      }
    } catch (error) {
      alert('Error generating image. Make sure the backend and image service are running.')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = 'generated-image.png'
    link.click()
  }

  return (
    <div className="image-gen">
      <div className="image-container">
        <div className="image-header">
          <ImageIcon size={24} />
          <h2>Image Generation</h2>
          <span className="no-filters-badge">No Filters - Complete Freedom</span>
        </div>

        <div className="image-controls">
          <div className="control-group">
            <label>Prompt (what you want to generate)</label>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
            />
          </div>

          <div className="control-group">
            <label>Negative Prompt (what you don't want)</label>
            <textarea
              className="prompt-input"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Optional: describe what to avoid..."
              rows={2}
            />
          </div>

          <div className="size-controls">
            <div className="size-input">
              <label>Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 512)}
                min={512}
                max={2048}
                step={64}
              />
            </div>
            <div className="size-input">
              <label>Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 512)}
                min={512}
                max={2048}
                step={64}
              />
            </div>
          </div>

          <button
            className="generate-button"
            onClick={generateImage}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {generatedImage && (
          <div className="image-result">
            <div className="result-header">
              <h3>Generated Image</h3>
              <button className="download-button" onClick={downloadImage}>
                <Download size={20} />
                Download
              </button>
            </div>
            <img src={generatedImage} alt="Generated" className="generated-image" />
          </div>
        )}
      </div>
    </div>
  )
}
