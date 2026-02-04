import { useState } from 'react'
import { Code2, Play, FileCode } from 'lucide-react'
import './CodeAssistant.css'

interface Props {
  personality: string
}

export default function CodeAssistant({ personality }: Props) {
  const [code, setCode] = useState('')
  const [task, setTask] = useState('complete')
  const [language, setLanguage] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) return

    setLoading(true)
    setResult('')

    try {
      const endpoint = `/api/code/${task}`
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          task,
          personality
        })
      })

      const data = await response.json()
      setResult(data.completion || data.explanation || data.refactored || 'No result')
    } catch (error) {
      setResult('Error: Failed to process code. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="code-assistant">
      <div className="code-container">
        <div className="code-header">
          <Code2 size={24} />
          <h2>Code Assistant</h2>
        </div>
        
        <div className="code-controls">
          <select
            className="task-select"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          >
            <option value="complete">Complete Code</option>
            <option value="explain">Explain Code</option>
            <option value="refactor">Refactor Code</option>
          </select>
          
          <input
            className="language-input"
            type="text"
            placeholder="Language (optional)"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          
          <button className="submit-button" onClick={handleSubmit} disabled={loading}>
            <Play size={20} />
            {loading ? 'Processing...' : 'Process'}
          </button>
        </div>

        <div className="code-editor-container">
          <div className="editor-section">
            <label className="section-label">
              <FileCode size={18} />
              Your Code
            </label>
            <textarea
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or type your code here..."
              spellCheck={false}
            />
          </div>

          {result && (
            <div className="result-section">
              <label className="section-label">Result</label>
              <pre className="code-result">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
