import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './markdown-previewer.css'

interface MarkdownStats {
  characters: number
  words: number
  lines: number
  headings: number
  links: number
  images: number
  codeBlocks: number
}

const MarkdownPreviewer: React.FC = () => {
  const [markdownText, setMarkdownText] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [stats, setStats] = useState<MarkdownStats | null>(null)

  // Simple markdown to HTML converter
  const convertMarkdownToHtml = useCallback((markdown: string): string => {
    if (!markdown.trim()) return ''

    let html = markdown
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Headers (must be before other processing)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // Code blocks (triple backticks)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${language}>${code.trim()}</code></pre>`
    })

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    // Bold and italic (must be before links)
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>')

    // Blockquotes
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')

    // Unordered lists
    html = html.replace(/^\* (.*)$/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

    // Ordered lists
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/s, (match) => {
      if (!match.includes('<ul>')) {
        return `<ol>${match}</ol>`
      }
      return match
    })

    // Tables
    html = html.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim())
      const cellTags = cells.map((cell: string) => `<td>${cell}</td>`).join('')
      return `<tr>${cellTags}</tr>`
    })
    html = html.replace(/(<tr>.*<\/tr>)/s, '<table>$1</table>')

    // Line breaks (convert double newlines to paragraphs)
    html = html.replace(/\n\n/g, '</p><p>')
    html = html.replace(/\n/g, '<br>')
    
    // Wrap in paragraphs if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`
    }

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p><br><\/p>/g, '')

    return html
  }, [])

  // Calculate markdown statistics
  const calculateStats = useCallback((text: string): MarkdownStats => {
    const characters = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const headings = (text.match(/^#{1,6}\s/gm) || []).length
    const links = (text.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length
    const images = (text.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length

    return {
      characters,
      words,
      lines,
      headings,
      links,
      images,
      codeBlocks
    }
  }, [])

  // Convert markdown to HTML
  const htmlContent = useMemo(() => {
    return convertMarkdownToHtml(markdownText)
  }, [markdownText, convertMarkdownToHtml])

  // Update stats when text changes
  useEffect(() => {
    setStats(calculateStats(markdownText))
  }, [markdownText, calculateStats])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard!`)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [])

  // Export as HTML
  const exportAsHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `markdown-export-${Date.now()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [htmlContent])

  // Load sample markdown
  const loadSample = useCallback(() => {
    setMarkdownText(`# Markdown Previewer Sample

This is a **sample markdown document** to demonstrate the *markdown previewer* functionality.

## Features

### Text Formatting
- **Bold text** using \`**bold**\`
- *Italic text* using \`*italic*\`
- \`Inline code\` using backticks
- ***Bold and italic*** using \`***text***\`

### Lists

#### Unordered List
* First item
* Second item
* Third item

#### Ordered List
1. First step
2. Second step
3. Third step

### Links and Images
- [Visit GitHub](https://github.com)
- ![Sample Image](https://via.placeholder.com/300x200?text=Sample+Image)

### Code Blocks

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

### Blockquotes

> This is a blockquote. It can be used to highlight important information or quotes from other sources.

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ | H1, H2, H3 supported |
| Lists | ✅ | Ordered and unordered |
| Links | ✅ | External links open in new tab |
| Images | ✅ | Responsive images |
| Code | ✅ | Inline and block code |

### Horizontal Rule

---

## Conclusion

This markdown previewer supports most common markdown features and provides a clean, readable output.`)
  }, [])

  // Clear all content
  const clearAll = useCallback(() => {
    setMarkdownText('')
    setCopyFeedback('')
  }, [])

  return (
    <div className="markdown-previewer">
      <h2>Markdown Previewer</h2>

      <div className="markdown-section controls-section">
        <div className="view-mode-group">
          <label className="view-mode-label">View Mode:</label>
          <div className="view-mode-buttons">
            <button 
              className={`view-mode-button ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              📱 Split View
            </button>
            <button 
              className={`view-mode-button ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
            >
              ✏️ Editor Only
            </button>
            <button 
              className={`view-mode-button ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              👁️ Preview Only
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button className="copy-markdown-button" onClick={() => copyToClipboard(markdownText, 'Markdown')}>
            📋 Copy Markdown
          </button>
          <button className="copy-html-button" onClick={() => copyToClipboard(htmlContent, 'HTML')}>
            🔗 Copy HTML
          </button>
          <button className="export-button" onClick={exportAsHtml}>
            💾 Export HTML
          </button>
          <button className="clear-button" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
      )}

      <div className={`markdown-section content-section view-mode-${viewMode}`}>
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className="editor-panel">
            <div className="panel-header">
              <label className="panel-label">📝 Markdown Editor</label>
              {stats && (
                <div className="editor-stats">
                  <span className="stat-item">{stats.characters} chars</span>
                  <span className="stat-item">{stats.words} words</span>
                  <span className="stat-item">{stats.lines} lines</span>
                </div>
              )}
            </div>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="Enter your markdown here..."
              className="markdown-textarea"
              rows={20}
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="preview-panel">
            <div className="panel-header">
              <label className="panel-label">👁️ Live Preview</label>
              {stats && (
                <div className="preview-stats">
                  <span className="stat-item">{stats.headings} headings</span>
                  <span className="stat-item">{stats.links} links</span>
                  <span className="stat-item">{stats.images} images</span>
                  <span className="stat-item">{stats.codeBlocks} code blocks</span>
                </div>
              )}
            </div>
            <div 
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="empty-preview">Preview will appear here...</p>' }}
            />
          </div>
        )}
      </div>

      {stats && (
        <div className="markdown-section stats-section">
          <label className="section-label">📊 Document Statistics</label>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.characters}</span>
              <span className="stat-label">Characters</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.words}</span>
              <span className="stat-label">Words</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.lines}</span>
              <span className="stat-label">Lines</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.headings}</span>
              <span className="stat-label">Headings</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.links}</span>
              <span className="stat-label">Links</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.images}</span>
              <span className="stat-label">Images</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.codeBlocks}</span>
              <span className="stat-label">Code Blocks</span>
            </div>
          </div>
        </div>
      )}

      <div className="markdown-section help-section">
        <label className="section-label">📚 Markdown Syntax Guide</label>
        <div className="syntax-grid">
          <div className="syntax-card">
            <div className="syntax-title">Headers</div>
            <div className="syntax-example">
              <code># H1</code><br/>
              <code>## H2</code><br/>
              <code>### H3</code>
            </div>
          </div>
          <div className="syntax-card">
            <div className="syntax-title">Text Formatting</div>
            <div className="syntax-example">
              <code>**bold**</code><br/>
              <code>*italic*</code><br/>
              <code>`code`</code>
            </div>
          </div>
          <div className="syntax-card">
            <div className="syntax-title">Lists</div>
            <div className="syntax-example">
              <code>* Unordered</code><br/>
              <code>1. Ordered</code>
            </div>
          </div>
          <div className="syntax-card">
            <div className="syntax-title">Links & Images</div>
            <div className="syntax-example">
              <code>[Link](url)</code><br/>
              <code>![Image](url)</code>
            </div>
          </div>
          <div className="syntax-card">
            <div className="syntax-title">Code Blocks</div>
            <div className="syntax-example">
              <code>```language</code><br/>
              <code>code here</code><br/>
              <code>```</code>
            </div>
          </div>
          <div className="syntax-card">
            <div className="syntax-title">Blockquotes</div>
            <div className="syntax-example">
              <code>&gt; Quote text</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkdownPreviewer
