import { tool, CoreTool } from 'ai';
import { z } from 'zod';
import { githubReadFile, githubListContents } from './githubUtils';

// Tool context interface
export interface ToolContext {
  gitHubToken?: string;
}

// View file tool
const viewFileParams = z.object({
  path: z.string().describe("The path of the file to view"),
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
  branch: z.string().describe("The branch to view the file from"),
});

type ViewFileParams = z.infer<typeof viewFileParams>;

type ViewFileResult = {
  success: boolean;
  content?: string;
  error?: string;
  summary: string;
  details: string;
};

export const viewFileTool = (context: ToolContext): CoreTool<typeof viewFileParams, ViewFileResult> => tool({
  description: "View file contents at path",
  parameters: viewFileParams,
  execute: async ({ path, owner, repo, branch }: ViewFileParams): Promise<ViewFileResult> => {
    if (!context.gitHubToken) {
      return {
        success: false,
        error: "Missing GitHub token",
        summary: "Failed to view file due to missing GitHub token",
        details: "The GitHub token is missing. Please ensure it is provided in the context."
      };
    }

    try {
      const content = await githubReadFile({
        path,
        token: context.gitHubToken,
        repoOwner: owner,
        repoName: repo,
        branch
      });

      return {
        success: true,
        content: content,
        summary: `Viewed ${path} in ${owner}/${repo} on branch ${branch}`,
        details: `File contents of ${path} in ${owner}/${repo} on branch ${branch} have been retrieved:\n\n${content}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        summary: `Failed to view ${path} in ${owner}/${repo} on branch ${branch}`,
        details: `Failed to retrieve file contents at ${path} in ${owner}/${repo} on branch ${branch}. Error: ${errorMessage}`
      };
    }
  },
});

// View folder tool
const viewFolderParams = z.object({
  path: z.string().describe("The path to view the folder contents"),
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
  branch: z.string().describe("The branch to view the folder from"),
});

type ViewFolderParams = z.infer<typeof viewFolderParams>;

type ViewFolderResult = {
  success: boolean;
  contents?: string[];
  error?: string;
  summary: string;
  details: string;
};

export const viewFolderTool = (context: ToolContext): CoreTool<typeof viewFolderParams, ViewFolderResult> => tool({
  description: "View folder contents at path (one level deep)",
  parameters: viewFolderParams,
  execute: async ({ path, owner, repo, branch }: ViewFolderParams): Promise<ViewFolderResult> => {
    if (!context.gitHubToken) {
      return {
        success: false,
        error: "Missing GitHub token",
        summary: "Failed to view folder contents due to missing GitHub token",
        details: "The GitHub token is missing. Please ensure it is provided in the context."
      };
    }

    try {
      const contents = await githubListContents({
        path,
        token: context.gitHubToken,
        repoOwner: owner,
        repoName: repo,
        branch
      });

      return {
        success: true,
        contents,
        summary: `Listed contents of ${path} in ${owner}/${repo} on branch ${branch}`,
        details: `Contents of ${path} in ${owner}/${repo} on branch ${branch}:\n${contents.join('\n')}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        summary: `Failed to list contents at ${path} in ${owner}/${repo} on branch ${branch}`,
        details: `Failed to retrieve directory contents at ${path} in ${owner}/${repo} on branch ${branch}. Error: ${errorMessage}`
      };
    }
  },
});

// Export all tools
export const allTools = {
  view_file: { tool: viewFileTool, description: "View file contents at path" },
  view_folder: { tool: viewFolderTool, description: "View folder contents at path" },
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