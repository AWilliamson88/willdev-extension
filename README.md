# WillDev - Developer Toolkit Browser Extension

A comprehensive developer toolkit browser extension with 24+ utilities for text processing, encoding, formatting, and web development.

![Version](https://img.shields.io/badge/version-0.0.20-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

### Text & Content Tools
- **Text Comparer** - Side-by-side diff viewer with word-level comparison
- **Text Tools** - Case conversion, escaping, URL encoding, transformations
- **Advanced Text** - Text analysis, frequency analysis, readability scoring
- **Markdown Previewer** - Live markdown rendering with export options
- **Regex Tester** - Pattern testing with match highlighting and capture groups

### Web Development
- **Web Dev Utils** - CSS gradient, box shadow, flexbox, and grid generators
- **Color Tools** - Color picker, converter, and palette generator
- **QR Generator** - Generate QR codes for URLs, WiFi, vCards, and more
- **API Testing** - HTTP client with authentication support

### Data & Formatting
- **JSON Formatter** - Validate, prettify, and minify JSON
- **SQL Formatter** - Format SQL queries with syntax highlighting
- **XML Formatter** - Validate and format XML documents
- **Data Converter** - Convert between CSV, JSON, XML, and YAML

### Security & Encoding
- **JWT Decoder** - Decode and inspect JWT tokens
- **Hash Generators** - Generate MD5, SHA-1, SHA-256, SHA-512 hashes
- **Encoding Utilities** - Hex, binary, ASCII, Unicode, and Morse code
- **Base64 Text/Image** - Encode and decode Base64 data
- **HTML/URL Encoder** - Encode and decode HTML entities and URLs

### Developer Tools
- **Developer Utilities** - Timestamp converter, Lorem ipsum, password generator
- **GUID Generator** - Generate UUIDs with multiple format options

### File & Image
- **File Utilities** - File hashing, splitting, and metadata extraction
- **Image Tools** - Resize, convert, compress, crop, and apply filters

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router v7** - Client-side routing
- **Material-UI v6** - UI component library
- **Chrome Extension Manifest v3** - Modern extension architecture

## 📦 Installation & Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Chrome/Edge browser

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AWilliamson88/willdev-extension.git
   cd willdev-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in browser**
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Development

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## 📁 Project Structure

```
willdev-extension/
├── src/
│   ├── pages/           # Tool components (25 tools)
│   ├── components/      # Shared components
│   ├── router.tsx       # Route configuration
│   └── main.tsx         # App entry point
├── public/
│   ├── manifest.json    # Extension manifest
│   └── background.js    # Background service worker
└── dist/                # Build output (load this in browser)
```

## 🎯 Roadmap

See [PROJECT_FEATURES_WORKING.md](PROJECT_FEATURES_WORKING.md) for detailed feature tracking and roadmap.

**Current Status**: 24/50+ features completed (~48%)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🐛 Known Issues

- Custom MD5 implementation (being replaced with library)
- File size limits being added for large file processing
- JWT decoder needs additional validation

## 📞 Contact

Andrew Williamson - [@AWilliamson88](https://github.com/AWilliamson88)

Project Link: [https://github.com/AWilliamson88/willdev-extension](https://github.com/AWilliamson88/willdev-extension)
