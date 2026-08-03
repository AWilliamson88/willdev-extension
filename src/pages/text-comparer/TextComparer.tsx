// src/pages/text-comparer/TextComparer.tsx
import React, { useState } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import './text-comparer.css'
import { FormControlLabel, Switch } from '@mui/material'

const TextComparer: React.FC = () => {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')

  // ReactDiffViewer boolean control states
  const [splitView, setSplitView] = useState(true)
  const [disableWordDiff, setDisableWordDiff] = useState(false)
  const [showDiffOnly, setShowDiffOnly] = useState(false)
  const [useDarkTheme, setUseDarkTheme] = useState(true)
  const [hideLineNumbers, setHideLineNumbers] = useState(false)
  const [leftTitle, setLeftTitle] = useState('')
  const [rightTitle, setRightTitle] = useState('')

  const clearText1 = () => setText1('')
  const clearText2 = () => setText2('')
  const clearAll = () => {
    setText1('')
    setText2('')
  }

  return (
    <div className="text-comparer">
      <div className="header">
        <h2>Text Comparer</h2>
        <button className="clear-all-button" onClick={clearAll}>
          Clear All
        </button>
      </div>

      {/* Diff Viewer Controls */}
      <div className="diff-controls-section">
        <h3>Diff Viewer Options</h3>
        <div className="controls-grid">
          <FormControlLabel
            control={
              <Switch
                checked={splitView}
                onChange={(e) => setSplitView(e.target.checked)}
              />
            }
            label="Split View"
          />
          <FormControlLabel
            control={
              <Switch
                checked={!disableWordDiff}
                onChange={(e) => setDisableWordDiff(!e.target.checked)}
              />
            }
            label="Word Diff"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showDiffOnly}
                onChange={(e) => setShowDiffOnly(e.target.checked)}
              />
            }
            label="Show Diff Only"
          />
          <FormControlLabel
            control={
              <Switch
                checked={useDarkTheme}
                onChange={(e) => setUseDarkTheme(e.target.checked)}
              />
            }
            label="Dark Theme"
          />
          <FormControlLabel
            control={
              <Switch
                checked={!hideLineNumbers}
                onChange={(e) => setHideLineNumbers(!e.target.checked)}
              />
            }
            label="Line Numbers"
          />
          <FormControlLabel
            control={
              <Switch
                checked={leftTitle !== ''}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLeftTitle('Original Text')
                    setRightTitle('Revised Text')
                  } else {
                    setLeftTitle('')
                    setRightTitle('')
                  }
                }}
              />
            }
            label="Show Titles"
          />
        </div>
      </div>

      <div className="input-container">
        <div className="text-field">
          <div className="text-field-header">
            <label className="text-field-label">Original Text</label>
            <button className="clear-button" onClick={clearText1}>
              Clear
            </button>
          </div>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder="Enter original text"
          />
        </div>
        <div className="text-field">
          <div className="text-field-header">
            <label className="text-field-label">Revised Text</label>
            <button className="clear-button" onClick={clearText2}>
              Clear
            </button>
          </div>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Enter revised text"
          />
        </div>
      </div>
      <div className="diff-viewer-container">
        <ReactDiffViewer
          oldValue={text1}
          newValue={text2}
          splitView={splitView}
          disableWordDiff={disableWordDiff}
          showDiffOnly={showDiffOnly}
          useDarkTheme={useDarkTheme}
          hideLineNumbers={hideLineNumbers}
          leftTitle={leftTitle || undefined}
          rightTitle={rightTitle || undefined}
          styles={{
            variables: {
              dark: {
                addedBackground: 'transparent',
              },
            },
            line: {
              background: 'transparent',
            },
            contentText: {
              // background: 'transparent',
            },
            gutter: {
              // background: 'transparent',
            },
            marker: {
              // background: 'transparent',
            },
          }}
        />
      </div>
    </div>
  )
}

export default TextComparer