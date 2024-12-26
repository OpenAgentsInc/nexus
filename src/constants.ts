export function formatNewlines(content: string): string {
  return content.replace(/\\n/g, '\n');
}
