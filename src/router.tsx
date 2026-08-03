
import React, { useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import SideMenu from './components/SideMenu/SideMenu' // Adjust path if needed
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import { lazy } from "react";
import { MenuItem } from "types";

const TextComparer = lazy(() => import('./pages/text-comparer/TextComparer'));
const JwtDecoder = lazy(() => import('./pages/jwt-decoder/JwtDecoder'));
const GuidGenerator = lazy(() => import('./pages/guid-generator/GuidGenerator'));
const HtmlEncoder = lazy(() => import('./pages/html-encoder/HtmlEncoder'));
const UrlEncoder = lazy(() => import('./pages/url-encoder/UrlEncoder'));
const Base64Text = lazy(() => import('./pages/base64-text/Base64Text'));
const Base64Image = lazy(() => import('./pages/base64-image/Base64Image'));
const JsonFormatter = lazy(() => import('./pages/json-formatter/JsonFormatter'));
const SqlFormatter = lazy(() => import('./pages/sql-formatter/SqlFormatter'));
const XmlFormatter = lazy(() => import('./pages/xml-formatter/XmlFormatter'));
const HashGenerators = lazy(() => import('./pages/hash-generators/HashGenerators'));
const ColorTools = lazy(() => import('./pages/color-tools/ColorTools'));
const QrGenerator = lazy(() => import('./pages/qr-generator/QrGenerator'));
const RegexTester = lazy(() => import('./pages/regex-tester/RegexTester'));
const MarkdownPreviewer = lazy(() => import('./pages/markdown-previewer/MarkdownPreviewer'));
const DeveloperUtilities = lazy(() => import('./pages/developer-utilities/DeveloperUtilities'));
const EncodingUtilities = lazy(() => import('./pages/encoding-utilities/EncodingUtilities'));
const ImageTools = lazy(() => import('./pages/image-tools/ImageTools'));
const DataConverter = lazy(() => import('./pages/data-converter/DataConverter'));
const FileUtilities = lazy(() => import('./pages/file-utilities/FileUtilities'));
const ApiTesting = lazy(() => import('./pages/api-testing/ApiTesting'));
const AdvancedText = lazy(() => import('./pages/advanced-text/AdvancedText'));
const WebDevUtils = lazy(() => import('./pages/web-dev-utils/WebDevUtils'));
const TextTools = lazy(() => import('./pages/text-tools/TextTools'));

const routes: MenuItem[] = [
  // Text & Content
  {
    path: "/text-comparer",
    name: "Text Comparer",
    element: <TextComparer />,
    category: "Text & Content",
  },
  {
    path: "/text-tools",
    name: "Text Tools",
    element: <TextTools />,
    category: "Text & Content",
  },
  {
    path: "/advanced-text",
    name: "Advanced Text",
    element: <AdvancedText />,
    category: "Text & Content",
  },
  {
    path: "/markdown-previewer",
    name: "Markdown Previewer",
    element: <MarkdownPreviewer />,
    category: "Text & Content",
  },
  {
    path: "/regex-tester",
    name: "Regex Tester",
    element: <RegexTester />,
    category: "Text & Content",
  },

  // Web Development
  {
    path: "/web-dev-utils",
    name: "Web Dev Utils",
    element: <WebDevUtils />,
    category: "Web Development",
  },
  {
    path: "/color-tools",
    name: "Color Tools",
    element: <ColorTools />,
    category: "Web Development",
  },
  {
    path: "/qr-generator",
    name: "QR Generator",
    element: <QrGenerator />,
    category: "Web Development",
  },
  {
    path: "/api-testing",
    name: "API Testing",
    element: <ApiTesting />,
    category: "Web Development",
  },

  // Data & Formatting
  {
    path: "/json-formatter",
    name: "JSON Formatter",
    element: <JsonFormatter />,
    category: "Data & Formatting",
  },
  {
    path: "/sql-formatter",
    name: "SQL Formatter",
    element: <SqlFormatter />,
    category: "Data & Formatting",
  },
  {
    path: "/xml-formatter",
    name: "XML Formatter",
    element: <XmlFormatter />,
    category: "Data & Formatting",
  },
  {
    path: "/data-converter",
    name: "Data Converter",
    element: <DataConverter />,
    category: "Data & Formatting",
  },

  // Security & Encoding
  {
    path: "/jwt-decoder",
    name: "JWT Decoder",
    element: <JwtDecoder />,
    category: "Security & Encoding",
  },
  {
    path: "/hash-generators",
    name: "Hash Generators",
    element: <HashGenerators />,
    category: "Security & Encoding",
  },
  {
    path: "/encoding-utilities",
    name: "Encoding Utilities",
    element: <EncodingUtilities />,
    category: "Security & Encoding",
  },
  {
    path: "/html-encoder",
    name: "HTML Encoder",
    element: <HtmlEncoder />,
    category: "Security & Encoding",
  },
  {
    path: "/url-encoder",
    name: "URL Encoder",
    element: <UrlEncoder />,
    category: "Security & Encoding",
  },
  {
    path: "/base64-text",
    name: "Base64 Text",
    element: <Base64Text />,
    category: "Security & Encoding",
  },
  {
    path: "/base64-image",
    name: "Base64 Image",
    element: <Base64Image />,
    category: "Security & Encoding",
  },

  // Developer Tools
  {
    path: "/developer-utilities",
    name: "Developer Utilities",
    element: <DeveloperUtilities />,
    category: "Developer Tools",
  },
  {
    path: "/guid-generator",
    name: "GUID Generator",
    element: <GuidGenerator />,
    category: "Developer Tools",
  },

  // File & Image
  {
    path: "/file-utilities",
    name: "File Utilities",
    element: <FileUtilities />,
    category: "File & Image",
  },
  {
    path: "/image-tools",
    name: "Image Tools",
    element: <ImageTools />,
    category: "File & Image",
  }
];

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

const AppContent: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // On initial load, if the path is /index.html, redirect to /
    if (window.location.pathname === '/index.html') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <SideMenu routes={routes} projectName="WillDev">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          <Route path="/" element={<Navigate to="/text-comparer" replace />} />
          <Route path="/text-comparer" element={<TextComparer />} />
          <Route path="/jwt-decoder" element={<JwtDecoder />} />
          <Route path="/guid-generator" element={<GuidGenerator />} />
          <Route path="/html-encoder" element={<HtmlEncoder />} />
          <Route path="/url-encoder" element={<UrlEncoder />} />
          <Route path="/base64-text" element={<Base64Text />} />
          <Route path="/base64-image" element={<Base64Image />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
          <Route path="/sql-formatter" element={<SqlFormatter />} />
          <Route path="/xml-formatter" element={<XmlFormatter />} />
          <Route path="/hash-generators" element={<HashGenerators />} />
          <Route path="/color-tools" element={<ColorTools />} />
          <Route path="/qr-generator" element={<QrGenerator />} />
          <Route path="/regex-tester" element={<RegexTester />} />
          <Route path="/markdown-previewer" element={<MarkdownPreviewer />} />
          <Route path="/developer-utilities" element={<DeveloperUtilities />} />
          <Route path="/encoding-utilities" element={<EncodingUtilities />} />
          <Route path="/image-tools" element={<ImageTools />} />
          <Route path="/data-converter" element={<DataConverter />} />
          <Route path="/file-utilities" element={<FileUtilities />} />
          <Route path="/api-testing" element={<ApiTesting />} />
          <Route path="/advanced-text" element={<AdvancedText />} />
          <Route path="/web-dev-utils" element={<WebDevUtils />} />
          <Route path="/text-tools" element={<TextTools />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </SideMenu>
  )
}

export default Router
