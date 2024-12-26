# Handling Backslash Escaping Issues in Nexus

## Problem

The Nexus API was experiencing issues with excessive backslash escaping in file contents. This manifested in several ways:

1. File contents showing up with triple backslashes (`\\\`)
2. Escaped quotes appearing as `\\\"` instead of `"`
3. Newlines appearing as `\\n` instead of actual line breaks
4. Content sometimes being wrapped in unnecessary backticks

This was happening because the content was going through multiple layers of escaping:

1. GitHub API base64 decoding
2. JSON stringification
3. Template literal embedding
4. Stream encoding
5. SSE (Server-Sent Events) formatting

## Root Causes

The issues stemmed from several points in the pipeline:

1. In `view-file.ts`:
   ```typescript
   details: `File contents of ${path} have been retrieved:\n\n${content}`
   ```
   Content was being embedded in template literals, causing additional escaping.

2. In `githubUtils.ts`:
   ```typescript
   return Buffer.from(data.content, 'base64').toString('utf-8');
   ```
   Raw content was being passed through without normalization.

3. In `app.ts`:
   ```typescript
   res.write(value);
   ```
   Stream chunks were being written directly without parsing/cleaning.

4. The original `formatNewlines` utility only handled newlines:
   ```typescript
   export function formatNewlines(content: string): string {
     return content.replace(/\\n/g, '\n');
   }
   ```

## Solution

### 1. Content Normalization

Created a comprehensive `normalizeContent` function in `utils.ts`:

```typescript
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
```

### 2. Stream Handling

Updated `app.ts` to properly handle streaming responses:

```typescript
// Parse and clean up the data before sending
try {
  const text = new TextDecoder().decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6); // Remove 'data: ' prefix
      if (data === '[DONE]') continue;
      
      try {
        // Parse and re-stringify to clean up escaping
        const parsed = JSON.parse(data);
        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
      } catch {
        // If it's not JSON, send as is
        res.write(`data: ${data}\n\n`);
      }
    }
  }
} catch (e) {
  console.error('Error processing stream chunk:', e);
  res.write(value);
}
```

### 3. Tool Updates

Modified the file operation tools to use the new normalization:

1. In `create-file.ts`:
```typescript
const normalizedContent = normalizeContent(content);
await githubCreateFile({
  path,
  content: normalizedContent,
  // ...
});
```

2. In `rewrite-file.ts`:
```typescript
const normalizedContent = normalizeContent(content);
const { oldContent } = await githubRewriteFile({
  content: normalizedContent,
  // ...
});
return {
  // ...
  newContent: normalizedContent,
  oldContent: normalizeContent(oldContent),
};
```

## Benefits

1. **Consistent Content Handling**: All content goes through a single normalization function
2. **Clean Output**: No more excessive backslashes or escaped characters
3. **Proper Streaming**: SSE data is properly parsed and re-stringified
4. **Better Readability**: File contents are displayed as intended without escaping artifacts

## Implementation Details

The fix was implemented across several files:

1. `src/tools/utils.ts` - New content normalization function
2. `src/tools/create-file.ts` - Updated to use normalization
3. `src/tools/rewrite-file.ts` - Updated to use normalization
4. `src/app.ts` - Improved stream handling
5. `src/githubUtils.ts` - Clean content handling

## Testing

To verify the fixes:
1. View a file with quotes and newlines
2. Create a file with complex content
3. Rewrite a file with mixed content
4. Check the streamed response format

The content should now appear clean and properly formatted without excessive escaping.