# WillDev Extension - Shared Utilities

This directory contains reusable hooks, functions, and validators to eliminate code duplication across components.

## 📦 What's Included

### Hooks

#### `useClipboard`
Copy text to clipboard with automatic feedback messages.

**Replaces**: 22 instances of clipboard logic across components

```tsx
import { useClipboard } from '../../utils'

const { copy, feedback } = useClipboard({
  successMessage: 'Copied!',
  feedbackDuration: 2000
})

// In your component
<button onClick={() => copy('Hello World')}>Copy</button>
{feedback && <div>{feedback}</div>}
```

#### `useFileUpload`
File upload with drag-and-drop, validation, and error handling.

**Replaces**: Drag-drop code in 4 components

```tsx
import { useFileUpload } from '../../utils'

const fileUpload = useFileUpload({
  acceptedTypes: ['image/png', 'image/jpeg'],
  maxSize: 10 * 1024 * 1024, // 10MB
  onFileSelect: (file) => console.log(file),
  onError: (error) => setError(error)
})

// In your render
<div {...fileUpload.dragDropProps} onClick={fileUpload.openFilePicker}>
  <input {...fileUpload.inputProps} style={{ display: 'none' }} />
  Drag and drop or click
</div>
```

### Formatters

All formatters are pure functions with no side effects.

```tsx
import { formatFileSize, formatTime, formatNumber } from '../../utils'

formatFileSize(1536)        // "1.50 KB"
formatTime(1234)            // "1.23s"
formatNumber(1234567)       // "1,234,567"
formatPercentage(0.755)     // "75.5%"
truncateString("Hello", 3)  // "Hel..."
formatRelativeTime(date)    // "2 hours ago"
```

### Validators

Boolean validators and error message generators.

```tsx
import { isValidJSON, validateFileSize } from '../../utils'

if (!isValidJSON(input)) {
  setError('Invalid JSON')
}

const error = validateFileSize(file, 10 * 1024 * 1024)
if (error) {
  setError(error) // "File size too large. Maximum size is 10MB."
}
```

**Available validators**:
- `isValidJSON`, `isValidXML`, `isValidJWT`
- `isValidURL`, `isValidEmail`, `isValidHexColor`
- `validateFileSize`, `validateFileType`
- `validateRange`, `validatePattern`, `validateRequired`
- `combineValidations` - Combine multiple validation results

## 🎯 Benefits

### Code Reduction
- **Before**: Each component had 50-100 lines of duplicated logic
- **After**: Import 1-2 utilities, use in 5-10 lines

### Consistency
- Same timeout durations (2000ms)
- Same error messages
- Same validation rules
- Same formatting across all tools

### Maintainability
- Bug fix once → all components benefit
- Add feature once → all components get it
- TypeScript types → better autocomplete

### Example Impact
**Base64Image component**:
- Before: 340 lines
- After: 281 lines
- Reduction: 17% (59 lines)

## 📖 Migration Guide

### Migrating Clipboard Logic

**Before**:
```tsx
const [copyFeedback, setCopyFeedback] = useState('')

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    setCopyFeedback('Copied!')
    setTimeout(() => setCopyFeedback(''), 2000)
  } catch {
    setCopyFeedback('Failed')
  }
}
```

**After**:
```tsx
const { copy, feedback } = useClipboard()

// Just call copy(text)
```

### Migrating File Upload

**Before**: 50-80 lines of drag-drop event handlers, validation, ref management

**After**: 1 hook call, spread props

### Migrating Formatters

**Before**: Each component defines its own `formatFileSize`

**After**: Import from `'../../utils'`

## 🚀 Next Steps

These utilities are ready to use. To migrate remaining components:

1. Search for `copyFeedback` → replace with `useClipboard`
2. Search for `formatFileSize` → replace with import
3. Search for `handleDragOver` → replace with `useFileUpload`

Estimated time saved per component: 20-30 minutes
Estimated maintenance burden reduction: 50%+
