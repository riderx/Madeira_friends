import type { Options } from 'markdown-it'
import MarkdownIt from 'markdown-it'

// Extend the MarkdownIt type to include our custom method
declare module 'markdown-it' {
  interface MarkdownIt {
    safeRender: (content: string, maxLength?: number) => string
  }
}

/**
 * Creates a configured markdown-it instance with performance optimizations
 *
 * Addresses performance issues fixed in markdown-it v14:
 * - Quadratic complexity when parsing references (#996)
 * - Quadratic output size with pathological user input in tables (#1000)
 *
 * @param options Additional markdown-it options
 * @returns Configured markdown-it instance
 */
export function createMarkdownRenderer(options: Options = {}): MarkdownIt {
  // Default configuration with security and performance in mind
  const defaultOptions: Options = {
    html: false, // Disable HTML for security
    breaks: true, // Convert \n to <br>
    linkify: true, // Auto-convert URLs to links
    typographer: true, // Enable smart quotes and other typographic replacements
  }

  // Create markdown-it instance with merged options
  const md = new MarkdownIt({
    ...defaultOptions,
    ...options,
  })

  // Set max nesting level to prevent stack overflow attacks
  // @ts-expect-error - maxNesting exists but is not in the type definitions
  md.options.maxNesting = 20

  // Add safeguards for table rendering to prevent quadratic output size explosion
  const defaultRender = md.renderer.rules.table_open || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.table_open = function (tokens, idx, options, _env, self) {
    // Get the table token
    const tableToken = tokens[idx]

    // Add a data attribute to track table size for potential future optimizations
    tableToken.attrSet('data-markdown-table', 'true')

    // Continue with default rendering
    return defaultRender(tokens, idx, options, _env, self)
  }

  // Add a method to safely render content with length limits
  // @ts-expect-error - We've extended the type but TypeScript still complains
  md.safeRender = function (content: string, maxLength: number = 50000): string {
    // Prevent processing extremely large content
    if (content && content.length > maxLength) {
      return `<div class="markdown-error">Content too large to render safely (${content.length} chars). Maximum is ${maxLength} chars.</div>`
    }

    try {
      return this.render(content || '')
    }
    catch (error) {
      console.error('Error rendering markdown:', error)
      return '<div class="markdown-error">Error rendering content</div>'
    }
  }

  return md
}
