import MarkdownIt from 'markdown-it'

/**
 * Creates a configured markdown-it instance with security and performance optimizations
 * 
 * @param options Configuration options
 * @param options.allowHtml Whether to allow HTML in markdown (defaults to false for security)
 * @returns Configured markdown-it instance
 */
export function createMarkdown(options: { allowHtml?: boolean } = {}) {
  return new MarkdownIt({
    html: options.allowHtml || false, // Disable HTML by default for security
    breaks: true, // Convert \n to <br>
    linkify: true, // Auto-convert URLs to links
    typographer: true, // Enable smart quotes and other typographic replacements
  })
}

/**
 * Safely renders markdown content with length limits to prevent DoS attacks
 * 
 * @param content Markdown content to render
 * @param options Rendering options
 * @param options.maxLength Maximum length of content to render (defaults to 50000)
 * @param options.allowHtml Whether to allow HTML in markdown (defaults to false)
 * @returns Rendered HTML
 */
export function renderMarkdown(content: string | null, options: { maxLength?: number, allowHtml?: boolean } = {}) {
  if (!content)
    return ''

  // Apply length limit if specified to prevent DoS attacks
  const maxLength = options.maxLength || 50000 // Default to 50k chars
  const truncatedContent = content.length > maxLength
    ? `${content.substring(0, maxLength)}...(content truncated for security)`
    : content

  const md = createMarkdown({ allowHtml: options.allowHtml })
  return md.render(truncatedContent)
}

/**
 * Formats description text with special handling for newlines
 * Used specifically for event descriptions to ensure proper paragraph formatting
 * 
 * @param description Markdown content to format and render
 * @param options Rendering options
 * @param options.maxLength Maximum length of content to render (defaults to 50000)
 * @param options.allowHtml Whether to allow HTML in markdown (defaults to false)
 * @returns Rendered HTML
 */
export function formatEventDescription(description: string | null, options: { maxLength?: number, allowHtml?: boolean } = {}) {
  if (!description)
    return ''

  // Replace multiple consecutive newlines with double breaks
  const formattedText = description
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to at most 2
    .replace(/\n/g, '\n\n') // Ensure single newlines are treated as paragraphs

  return renderMarkdown(formattedText, options)
}
