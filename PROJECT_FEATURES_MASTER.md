# WillDev Extension - Project Features Master List

> **🔒 AI ASSISTANT READ-ONLY MASTER REFERENCE FILE 🔒**
>
> **⚠️ IMPORTANT: This file is designated as READ-ONLY for the AI assistant.**
> **The AI assistant is NOT ALLOWED to make any modifications to this file.**
> **The user retains full editing rights and can modify this file as needed.**
>
> **For AI assistant: Use PROJECT_FEATURES_WORKING.md for all updates and progress tracking.**
>
> **This file serves as the definitive reference for:**
> - Original project scope and requirements
> - Complete feature specifications
> - Technical implementation guidelines
> - Architecture decisions

## Project Overview
WillDev is a developer toolkit browser extension built with React, TypeScript, and Vite. It provides various utilities for developers including text comparison, encoding/decoding, formatting, and text manipulation tools.

---

## 1. Text Comparison Tools
### Text Comparer
- [x] **Basic text comparison** - Side-by-side diff viewer
- [x] **Split view toggle** - Switch between split and unified view
- [x] **Word-level diff** - Toggle word-level vs line-level differences
- [x] **Show diff only** - Option to show only changed lines
- [x] **Dark theme support** - Dark/light theme toggle
- [x] **Line numbers** - Toggle line number display
- [x] **Custom titles** - Set custom titles for left/right panels
- [x] **Clear functionality** - Clear individual or both text areas

---

## 2. Encoding/Decoding Tools
### JWT Decoder
- [x] **JWT token parsing** - Decode JWT payload
- [x] **Error handling** - Display errors for invalid tokens
- [x] **JSON formatting** - Pretty-print decoded JSON
- [x] **Real-time decoding** - Decode as user types

### GUID Generator
- [ ] **UUID v4 generation** - Generate random UUIDs
- [ ] **Multiple format support** - With/without hyphens, uppercase/lowercase
- [ ] **Bulk generation** - Generate multiple GUIDs at once
- [ ] **Copy to clipboard** - One-click copy functionality

### HTML Encoder/Decoder
- [ ] **HTML entity encoding** - Convert special characters to HTML entities
- [ ] **HTML entity decoding** - Convert HTML entities back to characters
- [ ] **Bidirectional conversion** - Toggle between encode/decode modes
- [ ] **Real-time conversion** - Convert as user types

### URL Encoder/Decoder
- [ ] **URL encoding** - Encode special characters for URLs
- [ ] **URL decoding** - Decode URL-encoded strings
- [ ] **Component vs full URL** - Support for encoding URL components vs full URLs
- [ ] **Real-time conversion** - Convert as user types

### Base64 Text Encoder/Decoder
- [ ] **Base64 text encoding** - Encode text to Base64
- [ ] **Base64 text decoding** - Decode Base64 to text
- [ ] **UTF-8 support** - Handle Unicode characters properly
- [ ] **Real-time conversion** - Convert as user types

### Base64 Image Encoder/Decoder
- [ ] **Image to Base64** - Convert uploaded images to Base64 data URLs
- [ ] **Base64 to image** - Display Base64 encoded images
- [ ] **Multiple format support** - Support PNG, JPEG, GIF, WebP
- [ ] **File upload interface** - Drag-and-drop or click to upload
- [ ] **Image preview** - Show original and converted images

---

## 3. Formatting Tools
### JSON Formatter
- [ ] **JSON validation** - Validate JSON syntax
- [ ] **JSON prettification** - Format and indent JSON
- [ ] **JSON minification** - Remove whitespace and formatting
- [ ] **Error highlighting** - Show syntax errors with line numbers
- [ ] **Collapsible tree view** - Expandable/collapsible JSON structure

### SQL Formatter
- [ ] **SQL prettification** - Format and indent SQL queries
- [ ] **Keyword highlighting** - Syntax highlighting for SQL keywords
- [ ] **Multiple SQL dialects** - Support for different SQL variants
- [ ] **Query validation** - Basic syntax validation

### XML Formatter
- [ ] **XML validation** - Validate XML syntax and structure
- [ ] **XML prettification** - Format and indent XML
- [ ] **XML minification** - Remove whitespace and formatting
- [ ] **Error highlighting** - Show syntax errors with line numbers
- [ ] **Attribute formatting** - Format XML attributes consistently

---

## 4. Text Manipulation Tools
### Text Escape/Unescape
- [ ] **JavaScript string escaping** - Escape/unescape JS strings
- [ ] **JSON string escaping** - Escape/unescape JSON strings
- [ ] **CSV escaping** - Handle CSV special characters
- [ ] **Regex escaping** - Escape special regex characters
- [ ] **Multiple escape types** - Support various escaping formats

### Case Converter
- [ ] **Uppercase conversion** - Convert to UPPERCASE
- [ ] **Lowercase conversion** - Convert to lowercase
- [ ] **Title Case conversion** - Convert To Title Case
- [ ] **Sentence case conversion** - Convert to sentence case
- [ ] **camelCase conversion** - Convert to camelCase
- [ ] **PascalCase conversion** - Convert to PascalCase
- [ ] **snake_case conversion** - Convert to snake_case
- [ ] **kebab-case conversion** - Convert to kebab-case

### Text Inspector
- [ ] **Character count** - Count total characters
- [ ] **Word count** - Count words
- [ ] **Line count** - Count lines
- [ ] **Paragraph count** - Count paragraphs
- [ ] **Character frequency** - Show character usage statistics
- [ ] **Encoding detection** - Detect text encoding
- [ ] **Whitespace analysis** - Show tabs, spaces, line breaks

### Regex Tester
- [ ] **Pattern testing** - Test regex patterns against text
- [ ] **Match highlighting** - Highlight matches in text
- [ ] **Capture groups** - Show captured groups
- [ ] **Replace functionality** - Test regex replacements
- [ ] **Flag support** - Support for regex flags (g, i, m, s, u, y)
- [ ] **Pattern library** - Common regex patterns
- [ ] **Match statistics** - Show match count and positions

### XML Validator
- [ ] **XML syntax validation** - Check XML syntax
- [ ] **Well-formedness check** - Ensure XML is well-formed
- [ ] **DTD validation** - Validate against DTD (optional)
- [ ] **XSD validation** - Validate against XML Schema (optional)
- [ ] **Error reporting** - Detailed error messages with line numbers
- [ ] **Namespace support** - Handle XML namespaces

### Markdown Previewer
- [ ] **Markdown rendering** - Convert Markdown to HTML
- [ ] **Live preview** - Real-time preview as user types
- [ ] **Split view** - Side-by-side editor and preview
- [ ] **Syntax highlighting** - Highlight Markdown syntax in editor
- [ ] **Table support** - Render Markdown tables
- [ ] **Code block highlighting** - Syntax highlighting in code blocks
- [ ] **Export options** - Export as HTML or PDF

---

## Technical Implementation Notes
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **UI Components**: Material-UI (MUI) v6
- **Icons**: FontAwesome
- **Styling**: CSS with CSS variables for theming
- **Extension**: Chrome Extension Manifest v3

## Architecture Patterns
- **Component Structure**: Page-based components in `/src/pages/`
- **Routing**: Centralized routing in `/src/router.tsx`
- **Styling**: Component-specific CSS files
- **Navigation**: SideMenu wrapper component pattern
- **State Management**: React useState hooks (no external state management)

---

**Created**: 2025-09-29  
**Last Updated**: 2025-09-29  
**Version**: 1.0.0  
**Status**: MASTER REFERENCE - DO NOT MODIFY
