/**
 * Normalizes string content by:
 * 1. Converting escaped newlines to actual newlines
 * 2. Removing any backtick wrapping
 * 3. Unescaping any over-escaped quotes
 * 4. Normalizing line endings
 */
export function normalizeContent(content: string): string {
  if (!content) return content;

  // Remove any wrapping backticks
  content = content.replace(/^`|`$/g, '');
  
  // First replace any \n that should be newlines
  content = content.replace(/\\n/g, '\n');
  
  // Unescape quotes that are over-escaped
  content = content.replace(/\\+"/g, '"');
  content = content.replace(/\\+'/g, "'");
  
  // Remove any remaining excessive backslashes before newlines
  content = content.replace(/\\+\n/g, '\n');
  
  // Normalize line endings to just \n
  content = content.replace(/\r\n/g, '\n');
  
  return content;
}