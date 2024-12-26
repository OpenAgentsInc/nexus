import { viewFileTool } from './tools/view-file';
import { viewFolderTool } from './tools/view-folder';
import { createFileTool } from './tools/create-file';
import { rewriteFileTool } from './tools/rewrite-file';
import { ToolContext } from './tools/types';

// Export all tools
export const allTools = {
  view_file: { tool: viewFileTool, description: "View file contents at path" },
  view_folder: { tool: viewFolderTool, description: "View folder contents at path" },
  create_file: { tool: createFileTool, description: "Create a new file at path with content" },
  rewrite_file: { tool: rewriteFileTool, description: "Rewrite file at path with new content" },
} as const;

type ToolName = keyof typeof allTools;

export const getTools = (context: ToolContext, toolNames: ToolName[]) => {
  const tools: Partial<Record<ToolName, ReturnType<typeof allTools[ToolName]["tool"]>>> = {};
  toolNames.forEach(toolName => {
    if (allTools[toolName]) {
      tools[toolName] = allTools[toolName].tool(context);
    }
  });
  return tools;
};

export type { ToolContext } from './tools/types';