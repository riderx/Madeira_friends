# Markdown-it v14 Implementation Plan

## Phase 1: Dependency Update and Basic Security

### 1. Update Dependencies
```json
{
  "dependencies": {
    "markdown-it": "^14.1.0"
  },
  "devDependencies": {
    "@types/markdown-it": "^14.1.2"
  }
}
```

### 2. Implement Centralized Markdown Utility
The utility has been created at `src/utils/markdown.ts` with the following features:
- Secure default configuration (HTML disabled)
- Content length limits to prevent DoS attacks
- Consistent configuration across components
- Special formatting for event descriptions

### 3. Update Components

#### Event.vue
```javascript
// Replace:
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})

// With:
import { renderMarkdown } from '../utils/markdown'

// And replace:
v-html="md.render(event.description || '')"

// With:
v-html="renderMarkdown(event.description, { maxLength: 10000 })"
```

#### Rentals.vue
```javascript
// Replace:
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})

// With:
import { renderMarkdown } from '../utils/markdown'

// And replace:
v-html="md.render(rental.description || '')"

// With:
v-html="renderMarkdown(rental.description, { maxLength: 10000 })"
```

#### EventDetails.vue
```javascript
// Replace:
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
})

// With:
import { formatEventDescription } from '../utils/markdown'

// And replace:
function formatDescription(description: string | null) {
  if (!description)
    return ''

  const formattedText = description
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '\n\n')

  return md.render(formattedText)
}

// With:
function formatDescription(description: string | null) {
  return formatEventDescription(description, { maxLength: 20000 })
}
```

#### RentalDetails.vue
```javascript
// Replace:
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
})

// With:
import { renderMarkdown } from '../utils/markdown'

// And replace:
function formatDescription(description: string | null): string {
  if (!description)
    return ''

  return md.render(description)
}

// With:
function formatDescription(description: string | null): string {
  return renderMarkdown(description, { maxLength: 20000 })
}
```

## Phase 2: Enhanced Security (Future Improvements)

1. **Add Input Validation**
   - Validate markdown input when users create/edit content
   - Implement pattern detection for potentially malicious markdown

2. **Add Monitoring**
   - Add performance monitoring for markdown rendering
   - Log rendering errors and large content warnings

## Phase 3: Performance Optimizations (Future Improvements)

1. **Implement Server-side Rendering**
   - Pre-render markdown on the server to prevent client-side DoS attacks
   - Cache rendered HTML to improve performance

2. **Implement Progressive Loading**
   - For very large content, implement progressive loading
   - Only render visible portions of long markdown documents
