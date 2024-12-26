/**
 * Normalizes string content by:
 * 1. Converting escaped newlines to actual newlines
 * 2. Removing any backtick wrapping
 * 3. Unescaping any over-escaped quotes
 */
export function normalizeContent(content: string): string {
  // Remove any wrapping backticks
  content = content.replace(/^`|`$/g, '');
  
  // Convert escaped newlines to real newlines
  content = content.replace(/\\n/g, '\n');
  
  // Unescape quotes that are over-escaped
  content = content.replace(/\\+"/g, '"');
  content = content.replace(/\\+'/g, "'");
  
  // Remove any remaining excessive backslashes
  content = content.replace(/\\{2,}/g, '\\');
  
  return content;
}