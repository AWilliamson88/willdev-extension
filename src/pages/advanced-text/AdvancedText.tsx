import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './advanced-text.css'

type ProcessingMode = 'analysis' | 'diff' | 'bulk' | 'pipeline'

interface TextAnalysis {
  // Basic stats
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  
  // Advanced stats
  averageWordsPerSentence: number
  averageCharactersPerWord: number
  readabilityScore: number
  complexityScore: number
  
  // Character analysis
  uppercaseCount: number
  lowercaseCount: number
  digitCount: number
  specialCharCount: number
  whitespaceCount: number
  
  // Language analysis
  mostCommonWords: Array<{ word: string; count: number }>
  characterFrequency: Array<{ char: string; count: number; percentage: number }>
  
  // Structure analysis
  longestWord: string
  shortestWord: string
  longestSentence: string
  shortestSentence: string
  
  // Encoding analysis
  hasUnicode: boolean
  encoding: string
  byteSize: number
}

interface DiffResult {
  additions: string[]
  deletions: string[]
  changes: Array<{ from: string; to: string }>
  similarity: number
}

interface BulkOperation {
  id: string
  name: string
  text: string
  processed: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface PipelineStep {
  id: string
  operation: string
  parameters: Record<string, any>
  enabled: boolean
}

const AdvancedText: React.FC = () => {
  const [mode, setMode] = useState<ProcessingMode>('analysis')
  const [inputText, setInputText] = useState('')
  const [secondText, setSecondText] = useState('')
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([])
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
  const [pipelineResult, setPipelineResult] = useState('')
  const [processing, setProcessing] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')

  // Available pipeline operations
  const pipelineOperations = [
    'uppercase',
    'lowercase',
    'trim',
    'removeExtraSpaces',
    'removeNumbers',
    'removeSpecialChars',
    'extractEmails',
    'extractUrls',
    'sortLines',
    'uniqueLines',
    'reverseText',
    'reverseLines'
  ]

  // Calculate readability score (simplified Flesch Reading Ease)
  const calculateReadabilityScore = useCallback((text: string, words: number, sentences: number): number => {
    if (words === 0 || sentences === 0) return 0
    
    const syllables = text.toLowerCase().match(/[aeiouy]+/g)?.length || 0
    const avgSentenceLength = words / sentences
    const avgSyllablesPerWord = syllables / words
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    return Math.max(0, Math.min(100, score))
  }, [])

  // Calculate complexity score
  const calculateComplexityScore = useCallback((text: string): number => {
    const complexWords = text.match(/\b\w{7,}\b/g)?.length || 0
    const totalWords = text.trim().split(/\s+/).length
    return totalWords > 0 ? (complexWords / totalWords) * 100 : 0
  }, [])

  // Get most common words
  const getMostCommonWords = useCallback((text: string, limit: number = 10): Array<{ word: string; count: number }> => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }))
  }, [])

  // Get character frequency
  const getCharacterFrequency = useCallback((text: string, limit: number = 15): Array<{ char: string; count: number; percentage: number }> => {
    const chars = text.split('')
    const charCount = chars.reduce((acc, char) => {
      if (char !== ' ' && char !== '\n' && char !== '\t') {
        acc[char] = (acc[char] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const totalChars = Object.values(charCount).reduce((sum, count) => sum + count, 0)
    
    return Object.entries(charCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([char, count]) => ({
        char,
        count,
        percentage: (count / totalChars) * 100
      }))
  }, [])

  // Find longest and shortest words/sentences
  const findExtremes = useCallback((text: string) => {
    const words = text.match(/\b\w+\b/g) || []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    const longestWord = words.reduce((longest, word) => 
      word.length > longest.length ? word : longest, '')
    const shortestWord = words.reduce((shortest, word) => 
      word.length < shortest.length ? word : shortest, words[0] || '')
    
    const longestSentence = sentences.reduce((longest, sentence) => 
      sentence.length > longest.length ? sentence.trim() : longest, '')
    const shortestSentence = sentences.reduce((shortest, sentence) => 
      sentence.trim().length < shortest.trim().length ? sentence.trim() : shortest, sentences[0]?.trim() || '')
    
    return { longestWord, shortestWord, longestSentence, shortestSentence }
  }, [])

  // Perform comprehensive text analysis
  const analyzeText = useCallback(async (text: string): Promise<TextAnalysis> => {
    if (!text.trim()) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0,
        averageWordsPerSentence: 0,
        averageCharactersPerWord: 0,
        readabilityScore: 0,
        complexityScore: 0,
        uppercaseCount: 0,
        lowercaseCount: 0,
        digitCount: 0,
        specialCharCount: 0,
        whitespaceCount: 0,
        mostCommonWords: [],
        characterFrequency: [],
        longestWord: '',
        shortestWord: '',
        longestSentence: '',
        shortestSentence: '',
        hasUnicode: false,
        encoding: 'UTF-8',
        byteSize: 0
      }
    }

    // Basic counts
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim().split(/\s+/).length
    const lines = text.split('\n').length
    const paragraphs = text.trim().split(/\n\s*\n/).length
    const sentences = (text.match(/[.!?]+/g) || []).length

    // Advanced calculations
    const averageWordsPerSentence = sentences > 0 ? words / sentences : 0
    const averageCharactersPerWord = words > 0 ? charactersNoSpaces / words : 0
    const readabilityScore = calculateReadabilityScore(text, words, sentences)
    const complexityScore = calculateComplexityScore(text)

    // Character type counts
    const uppercaseCount = (text.match(/[A-Z]/g) || []).length
    const lowercaseCount = (text.match(/[a-z]/g) || []).length
    const digitCount = (text.match(/\d/g) || []).length
    const specialCharCount = (text.match(/[^\w\s]/g) || []).length
    const whitespaceCount = (text.match(/\s/g) || []).length

    // Language analysis
    const mostCommonWords = getMostCommonWords(text)
    const characterFrequency = getCharacterFrequency(text)

    // Structure analysis
    const { longestWord, shortestWord, longestSentence, shortestSentence } = findExtremes(text)

    // Encoding analysis
    const hasUnicode = /[^\x00-\x7F]/.test(text)
    const byteSize = new TextEncoder().encode(text).length

    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs,
      sentences,
      averageWordsPerSentence,
      averageCharactersPerWord,
      readabilityScore,
      complexityScore,
      uppercaseCount,
      lowercaseCount,
      digitCount,
      specialCharCount,
      whitespaceCount,
      mostCommonWords,
      characterFrequency,
      longestWord,
      shortestWord,
      longestSentence,
      shortestSentence,
      hasUnicode,
      encoding: 'UTF-8',
      byteSize
    }
  }, [calculateReadabilityScore, calculateComplexityScore, getMostCommonWords, getCharacterFrequency, findExtremes])

  // Perform advanced text diff
  const performDiff = useCallback((text1: string, text2: string): DiffResult => {
    const lines1 = text1.split('\n')
    const lines2 = text2.split('\n')
    
    const additions: string[] = []
    const deletions: string[] = []
    const changes: Array<{ from: string; to: string }> = []
    
    // Simple line-by-line comparison
    const maxLines = Math.max(lines1.length, lines2.length)
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || ''
      const line2 = lines2[i] || ''
      
      if (line1 && !line2) {
        deletions.push(line1)
      } else if (!line1 && line2) {
        additions.push(line2)
      } else if (line1 !== line2) {
        changes.push({ from: line1, to: line2 })
      }
    }
    
    // Calculate similarity (Jaccard similarity)
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0
    
    return { additions, deletions, changes, similarity }
  }, [])

  // Add bulk operation
  const addBulkOperation = useCallback(() => {
    const newOperation: BulkOperation = {
      id: `bulk_${Date.now()}`,
      name: `Text ${bulkOperations.length + 1}`,
      text: '',
      processed: '',
      status: 'pending'
    }
    setBulkOperations(prev => [...prev, newOperation])
  }, [bulkOperations.length])

  // Update bulk operation
  const updateBulkOperation = useCallback((id: string, field: keyof BulkOperation, value: string) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === id ? { ...op, [field]: value } : op
    ))
  }, [])

  // Remove bulk operation
  const removeBulkOperation = useCallback((id: string) => {
    setBulkOperations(prev => prev.filter(op => op.id !== id))
  }, [])

  // Add pipeline step
  const addPipelineStep = useCallback(() => {
    const newStep: PipelineStep = {
      id: `step_${Date.now()}`,
      operation: 'uppercase',
      parameters: {},
      enabled: true
    }
    setPipelineSteps(prev => [...prev, newStep])
  }, [])

  // Update pipeline step
  const updatePipelineStep = useCallback((id: string, field: keyof PipelineStep, value: any) => {
    setPipelineSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ))
  }, [])

  // Remove pipeline step
  const removePipelineStep = useCallback((id: string) => {
    setPipelineSteps(prev => prev.filter(step => step.id !== id))
  }, [])

  // Execute pipeline
  const executePipeline = useCallback((text: string): string => {
    return pipelineSteps
      .filter(step => step.enabled)
      .reduce((result, step) => {
        switch (step.operation) {
          case 'uppercase':
            return result.toUpperCase()
          case 'lowercase':
            return result.toLowerCase()
          case 'trim':
            return result.trim()
          case 'removeExtraSpaces':
            return result.replace(/\s+/g, ' ')
          case 'removeNumbers':
            return result.replace(/\d/g, '')
          case 'removeSpecialChars':
            return result.replace(/[^\w\s]/g, '')
          case 'extractEmails':
            return (result.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []).join('\n')
          case 'extractUrls':
            return (result.match(/https?:\/\/[^\s]+/g) || []).join('\n')
          case 'sortLines':
            return result.split('\n').sort().join('\n')
          case 'uniqueLines':
            return [...new Set(result.split('\n'))].join('\n')
          case 'reverseText':
            return result.split('').reverse().join('')
          case 'reverseLines':
            return result.split('\n').reverse().join('\n')
          default:
            return result
        }
      }, text)
  }, [pipelineSteps])

  // Handle mode-specific processing
  useEffect(() => {
    if (mode === 'analysis' && inputText) {
      setProcessing(true)
      analyzeText(inputText)
        .then(setAnalysis)
        .catch(err => setError(err.message))
        .finally(() => setProcessing(false))
    } else if (mode === 'diff' && inputText && secondText) {
      setDiffResult(performDiff(inputText, secondText))
    } else if (mode === 'pipeline' && inputText) {
      setPipelineResult(executePipeline(inputText))
    }
  }, [mode, inputText, secondText, analyzeText, performDiff, executePipeline])

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

  // Clear all data
  const clearAll = useCallback(() => {
    setInputText('')
    setSecondText('')
    setAnalysis(null)
    setDiffResult(null)
    setBulkOperations([])
    setPipelineSteps([])
    setPipelineResult('')
    setError('')
  }, [])

  // Load sample text
  const loadSample = useCallback(() => {
    const sampleText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`
    
    setInputText(sampleText)
    if (mode === 'diff') {
      setSecondText(sampleText.replace('Lorem ipsum', 'Sample text').replace('consectetur', 'modified'))
    }
  }, [mode])

  // Get mode description
  const getModeDescription = useCallback((currentMode: ProcessingMode): string => {
    const descriptions = {
      analysis: 'Perform comprehensive text analysis including readability, complexity, character frequency, and linguistic statistics',
      diff: 'Advanced text comparison with detailed difference analysis and similarity scoring',
      bulk: 'Process multiple text inputs simultaneously with the same transformation operations',
      pipeline: 'Create custom text processing pipelines by chaining multiple transformation operations'
    }
    return descriptions[currentMode]
  }, [])

  return (
    <div className="advanced-text">
      <h2>Advanced Text Processing</h2>

      <div className="processing-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Processing Mode:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'analysis' ? 'active' : ''}`}
              onClick={() => setMode('analysis')}
            >
              📊 Analysis
            </button>
            <button 
              className={`mode-button ${mode === 'diff' ? 'active' : ''}`}
              onClick={() => setMode('diff')}
            >
              🔍 Diff
            </button>
            <button 
              className={`mode-button ${mode === 'bulk' ? 'active' : ''}`}
              onClick={() => setMode('bulk')}
            >
              📦 Bulk
            </button>
            <button 
              className={`mode-button ${mode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setMode('pipeline')}
            >
              🔧 Pipeline
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button className="clear-button" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
      )}

      {error && (
        <div className="error-feedback">
          ❌ {error}
        </div>
      )}

      <div className="processing-section description-section">
        <label className="section-label">About This Mode</label>
        <p className="mode-description">{getModeDescription(mode)}</p>
      </div>

      {mode === 'analysis' && (
        <>
          <div className="processing-section input-section">
            <label className="section-label">Text Input</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to analyze..."
              className="text-input"
              rows={8}
            />
            <div className="input-stats">
              <span>{inputText.length} characters</span>
              <span>{inputText.trim().split(/\s+/).filter(w => w).length} words</span>
              <span>{inputText.split('\n').length} lines</span>
            </div>
          </div>

          {processing && (
            <div className="processing-section loading-section">
              <div className="loading-indicator">
                ⏳ Analyzing text...
              </div>
            </div>
          )}

          {analysis && (
            <div className="processing-section analysis-results">
              <label className="section-label">Analysis Results</label>

              <div className="analysis-tabs">
                <div className="analysis-tab basic-stats">
                  <h4>📊 Basic Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Characters:</span>
                      <span className="stat-value">{analysis.characters.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Characters (no spaces):</span>
                      <span className="stat-value">{analysis.charactersNoSpaces.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Words:</span>
                      <span className="stat-value">{analysis.words.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Lines:</span>
                      <span className="stat-value">{analysis.lines.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Paragraphs:</span>
                      <span className="stat-value">{analysis.paragraphs.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Sentences:</span>
                      <span className="stat-value">{analysis.sentences.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="analysis-tab advanced-stats">
                  <h4>🎯 Advanced Metrics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Avg words per sentence:</span>
                      <span className="stat-value">{analysis.averageWordsPerSentence.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg characters per word:</span>
                      <span className="stat-value">{analysis.averageCharactersPerWord.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Readability score:</span>
                      <span className="stat-value">{analysis.readabilityScore.toFixed(1)}/100</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Complexity score:</span>
                      <span className="stat-value">{analysis.complexityScore.toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">File size:</span>
                      <span className="stat-value">{analysis.byteSize} bytes</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Encoding:</span>
                      <span className="stat-value">{analysis.encoding} {analysis.hasUnicode ? '(Unicode)' : '(ASCII)'}</span>
                    </div>
                  </div>
                </div>

                <div className="analysis-tab character-stats">
                  <h4>🔤 Character Analysis</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Uppercase letters:</span>
                      <span className="stat-value">{analysis.uppercaseCount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Lowercase letters:</span>
                      <span className="stat-value">{analysis.lowercaseCount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Digits:</span>
                      <span className="stat-value">{analysis.digitCount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Special characters:</span>
                      <span className="stat-value">{analysis.specialCharCount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Whitespace:</span>
                      <span className="stat-value">{analysis.whitespaceCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="analysis-tab word-frequency">
                  <h4>📈 Most Common Words</h4>
                  <div className="frequency-list">
                    {analysis.mostCommonWords.map((item, index) => (
                      <div key={index} className="frequency-item">
                        <span className="frequency-rank">#{index + 1}</span>
                        <span className="frequency-word">{item.word}</span>
                        <span className="frequency-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analysis-tab char-frequency">
                  <h4>🔢 Character Frequency</h4>
                  <div className="frequency-list">
                    {analysis.characterFrequency.map((item, index) => (
                      <div key={index} className="frequency-item">
                        <span className="frequency-rank">#{index + 1}</span>
                        <span className="frequency-char">'{item.char}'</span>
                        <span className="frequency-count">{item.count} ({item.percentage.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analysis-tab structure-analysis">
                  <h4>🏗️ Structure Analysis</h4>
                  <div className="structure-items">
                    <div className="structure-item">
                      <span className="structure-label">Longest word:</span>
                      <span className="structure-value">"{analysis.longestWord}" ({analysis.longestWord.length} chars)</span>
                    </div>
                    <div className="structure-item">
                      <span className="structure-label">Shortest word:</span>
                      <span className="structure-value">"{analysis.shortestWord}" ({analysis.shortestWord.length} chars)</span>
                    </div>
                    <div className="structure-item">
                      <span className="structure-label">Longest sentence:</span>
                      <span className="structure-value">"{analysis.longestSentence.substring(0, 100)}..." ({analysis.longestSentence.length} chars)</span>
                    </div>
                    <div className="structure-item">
                      <span className="structure-label">Shortest sentence:</span>
                      <span className="structure-value">"{analysis.shortestSentence}" ({analysis.shortestSentence.length} chars)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analysis-actions">
                <button
                  className="copy-button"
                  onClick={() => {
                    const report = `Text Analysis Report
===================
Characters: ${analysis.characters.toLocaleString()}
Words: ${analysis.words.toLocaleString()}
Lines: ${analysis.lines.toLocaleString()}
Readability Score: ${analysis.readabilityScore.toFixed(1)}/100
Complexity Score: ${analysis.complexityScore.toFixed(1)}%
Most Common Word: "${analysis.mostCommonWords[0]?.word}" (${analysis.mostCommonWords[0]?.count} times)
Longest Word: "${analysis.longestWord}" (${analysis.longestWord.length} chars)
File Size: ${analysis.byteSize} bytes`
                    copyToClipboard(report, 'Analysis report')
                  }}
                >
                  📋 Copy Report
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'diff' && (
        <>
          <div className="processing-section diff-input-section">
            <div className="diff-inputs">
              <div className="diff-input-group">
                <label className="section-label">Original Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter original text..."
                  className="text-input"
                  rows={8}
                />
                <div className="input-stats">
                  <span>{inputText.length} characters</span>
                  <span>{inputText.split('\n').length} lines</span>
                </div>
              </div>

              <div className="diff-input-group">
                <label className="section-label">Modified Text</label>
                <textarea
                  value={secondText}
                  onChange={(e) => setSecondText(e.target.value)}
                  placeholder="Enter modified text..."
                  className="text-input"
                  rows={8}
                />
                <div className="input-stats">
                  <span>{secondText.length} characters</span>
                  <span>{secondText.split('\n').length} lines</span>
                </div>
              </div>
            </div>
          </div>

          {diffResult && (
            <div className="processing-section diff-results">
              <label className="section-label">Difference Analysis</label>

              <div className="diff-summary">
                <div className="diff-stat">
                  <span className="diff-label">Similarity:</span>
                  <span className="diff-value">{diffResult.similarity.toFixed(1)}%</span>
                </div>
                <div className="diff-stat">
                  <span className="diff-label">Additions:</span>
                  <span className="diff-value addition">{diffResult.additions.length} lines</span>
                </div>
                <div className="diff-stat">
                  <span className="diff-label">Deletions:</span>
                  <span className="diff-value deletion">{diffResult.deletions.length} lines</span>
                </div>
                <div className="diff-stat">
                  <span className="diff-label">Changes:</span>
                  <span className="diff-value change">{diffResult.changes.length} lines</span>
                </div>
              </div>

              <div className="diff-details">
                {diffResult.additions.length > 0 && (
                  <div className="diff-section additions">
                    <h4>➕ Additions ({diffResult.additions.length})</h4>
                    <div className="diff-lines">
                      {diffResult.additions.map((line, index) => (
                        <div key={index} className="diff-line addition">
                          + {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.deletions.length > 0 && (
                  <div className="diff-section deletions">
                    <h4>➖ Deletions ({diffResult.deletions.length})</h4>
                    <div className="diff-lines">
                      {diffResult.deletions.map((line, index) => (
                        <div key={index} className="diff-line deletion">
                          - {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.changes.length > 0 && (
                  <div className="diff-section changes">
                    <h4>🔄 Changes ({diffResult.changes.length})</h4>
                    <div className="diff-lines">
                      {diffResult.changes.map((change, index) => (
                        <div key={index} className="diff-change">
                          <div className="diff-line deletion">- {change.from}</div>
                          <div className="diff-line addition">+ {change.to}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="diff-actions">
                <button
                  className="copy-button"
                  onClick={() => {
                    const report = `Diff Analysis Report
==================
Similarity: ${diffResult.similarity.toFixed(1)}%
Additions: ${diffResult.additions.length} lines
Deletions: ${diffResult.deletions.length} lines
Changes: ${diffResult.changes.length} lines

Additions:
${diffResult.additions.map(line => `+ ${line}`).join('\n')}

Deletions:
${diffResult.deletions.map(line => `- ${line}`).join('\n')}

Changes:
${diffResult.changes.map(change => `- ${change.from}\n+ ${change.to}`).join('\n')}`
                    copyToClipboard(report, 'Diff report')
                  }}
                >
                  📋 Copy Diff Report
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'bulk' && (
        <>
          <div className="processing-section bulk-controls">
            <label className="section-label">Bulk Operations</label>
            <div className="bulk-actions">
              <button className="add-operation-button" onClick={addBulkOperation}>
                ➕ Add Text Input
              </button>
              <button
                className="process-all-button"
                onClick={() => {
                  setBulkOperations(prev => prev.map(op => ({
                    ...op,
                    processed: op.text.toUpperCase(), // Example transformation
                    status: 'completed'
                  })))
                }}
                disabled={bulkOperations.length === 0}
              >
                🚀 Process All (Uppercase)
              </button>
            </div>
          </div>

          <div className="processing-section bulk-operations">
            {bulkOperations.length === 0 ? (
              <div className="empty-state">
                <p>No text inputs added yet. Click "Add Text Input" to get started.</p>
              </div>
            ) : (
              <div className="bulk-list">
                {bulkOperations.map((operation) => (
                  <div key={operation.id} className="bulk-item">
                    <div className="bulk-header">
                      <input
                        type="text"
                        value={operation.name}
                        onChange={(e) => updateBulkOperation(operation.id, 'name', e.target.value)}
                        className="bulk-name"
                        placeholder="Operation name"
                      />
                      <span className={`bulk-status ${operation.status}`}>
                        {operation.status === 'pending' && '⏳'}
                        {operation.status === 'processing' && '🔄'}
                        {operation.status === 'completed' && '✅'}
                        {operation.status === 'error' && '❌'}
                        {operation.status}
                      </span>
                      <button
                        className="remove-operation-button"
                        onClick={() => removeBulkOperation(operation.id)}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="bulk-content">
                      <div className="bulk-input">
                        <label>Input Text:</label>
                        <textarea
                          value={operation.text}
                          onChange={(e) => updateBulkOperation(operation.id, 'text', e.target.value)}
                          placeholder="Enter text to process..."
                          rows={4}
                        />
                        <div className="input-stats">
                          {operation.text.length} characters
                        </div>
                      </div>

                      <div className="bulk-output">
                        <label>Processed Text:</label>
                        <textarea
                          value={operation.processed}
                          readOnly
                          placeholder="Processed text will appear here..."
                          rows={4}
                        />
                        <div className="output-actions">
                          <button
                            className="copy-button"
                            onClick={() => copyToClipboard(operation.processed, `${operation.name} result`)}
                            disabled={!operation.processed}
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    {operation.error && (
                      <div className="bulk-error">
                        ❌ {operation.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {bulkOperations.length > 0 && (
            <div className="processing-section bulk-summary">
              <label className="section-label">Bulk Summary</label>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="summary-label">Total operations:</span>
                  <span className="summary-value">{bulkOperations.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-label">Completed:</span>
                  <span className="summary-value">{bulkOperations.filter(op => op.status === 'completed').length}</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-label">Pending:</span>
                  <span className="summary-value">{bulkOperations.filter(op => op.status === 'pending').length}</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-label">Errors:</span>
                  <span className="summary-value">{bulkOperations.filter(op => op.status === 'error').length}</span>
                </div>
              </div>

              <div className="bulk-export">
                <button
                  className="export-button"
                  onClick={() => {
                    const results = bulkOperations
                      .filter(op => op.status === 'completed')
                      .map(op => `${op.name}:\n${op.processed}`)
                      .join('\n\n---\n\n')
                    copyToClipboard(results, 'All bulk results')
                  }}
                  disabled={bulkOperations.filter(op => op.status === 'completed').length === 0}
                >
                  📤 Export All Results
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'pipeline' && (
        <>
          <div className="processing-section pipeline-input">
            <label className="section-label">Pipeline Input</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to process through pipeline..."
              className="text-input"
              rows={6}
            />
            <div className="input-stats">
              <span>{inputText.length} characters</span>
              <span>{inputText.split('\n').length} lines</span>
            </div>
          </div>

          <div className="processing-section pipeline-steps">
            <label className="section-label">Pipeline Steps</label>
            <div className="pipeline-controls">
              <button className="add-step-button" onClick={addPipelineStep}>
                ➕ Add Step
              </button>
              <button
                className="execute-pipeline-button"
                onClick={() => setPipelineResult(executePipeline(inputText))}
                disabled={pipelineSteps.filter(step => step.enabled).length === 0 || !inputText}
              >
                🚀 Execute Pipeline
              </button>
            </div>

            {pipelineSteps.length === 0 ? (
              <div className="empty-state">
                <p>No pipeline steps added yet. Click "Add Step" to create your processing pipeline.</p>
              </div>
            ) : (
              <div className="steps-list">
                {pipelineSteps.map((step, index) => (
                  <div key={step.id} className="pipeline-step">
                    <div className="step-header">
                      <span className="step-number">#{index + 1}</span>
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={(e) => updatePipelineStep(step.id, 'enabled', e.target.checked)}
                        className="step-enabled"
                      />
                      <select
                        value={step.operation}
                        onChange={(e) => updatePipelineStep(step.id, 'operation', e.target.value)}
                        className="step-operation"
                      >
                        {pipelineOperations.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <button
                        className="remove-step-button"
                        onClick={() => removePipelineStep(step.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pipelineResult && (
            <div className="processing-section pipeline-result">
              <label className="section-label">Pipeline Result</label>
              <textarea
                value={pipelineResult}
                readOnly
                placeholder="Pipeline result will appear here..."
                className="text-output"
                rows={8}
              />
              <div className="result-stats">
                <span>{pipelineResult.length} characters</span>
                <span>{pipelineResult.split('\n').length} lines</span>
              </div>
              <div className="result-actions">
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(pipelineResult, 'Pipeline result')}
                >
                  📋 Copy Result
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="processing-section tips-section">
        <label className="section-label">Tips & Information</label>
        <div className="tips-content">
          {mode === 'analysis' && (
            <div className="tip-text">
              <p><strong>Readability Score:</strong> Higher scores (60-100) indicate easier reading. Lower scores suggest more complex text.</p>
              <p><strong>Complexity Score:</strong> Percentage of words with 7+ characters. Higher values indicate more complex vocabulary.</p>
              <p><strong>Character Frequency:</strong> Shows the most commonly used characters, useful for encoding analysis.</p>
            </div>
          )}
          {mode === 'diff' && (
            <div className="tip-text">
              <p><strong>Similarity Score:</strong> Based on Jaccard similarity of word sets. 100% means identical content.</p>
              <p><strong>Line-by-line Comparison:</strong> Shows additions, deletions, and changes between texts.</p>
              <p><strong>Use Cases:</strong> Compare document versions, code changes, or content revisions.</p>
            </div>
          )}
          {mode === 'bulk' && (
            <div className="tip-text">
              <p><strong>Bulk Processing:</strong> Apply the same transformation to multiple text inputs simultaneously.</p>
              <p><strong>Status Tracking:</strong> Monitor the progress of each operation with visual status indicators.</p>
              <p><strong>Export Results:</strong> Copy all processed results at once for external use.</p>
            </div>
          )}
          {mode === 'pipeline' && (
            <div className="tip-text">
              <p><strong>Pipeline Processing:</strong> Chain multiple text transformations in sequence.</p>
              <p><strong>Step Control:</strong> Enable/disable individual steps to customize your processing pipeline.</p>
              <p><strong>Order Matters:</strong> Steps are executed in the order they appear in the list.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedText
