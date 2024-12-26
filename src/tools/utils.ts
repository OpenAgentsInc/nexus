// export function formatNewlines(content: string): string {
//   return content.replace(/\\\\n/g, '\\n');
// }

// export function formatNewlines(content: string): string {
//   console.log("trying to format newlines with contnet: ", content);
//   return content.replace(/\\n/g, '\n');
// }

export function formatNewlines(content: string): string {
  return content.replace(/\\n/g, '\n');
}
