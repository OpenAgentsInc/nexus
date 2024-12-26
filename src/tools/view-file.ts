import { tool, CoreTool } from 'ai';
import { z } from 'zod';
import { githubReadFile } from '../githubUtils';
import { ToolContext } from './types';

const params = z.object({
  path: z.string().describe("The path of the file to view"),
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
  branch: z.string().describe("The branch to view the file from"),
});

type Params = z.infer<typeof params>;

type Result = {
  success: boolean;
  content?: string;
  error?: string;
  summary: string;
  details: string;
};

export const viewFileTool = (context: ToolContext): CoreTool<typeof params, Result> => tool({
  description: "View file contents at path",
  parameters: params,
  execute: async ({ path, owner, repo, branch }: Params): Promise<Result> => {
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

      // Create a clean summary that doesn't include the full content
      const summary = `Viewed ${path} in ${owner}/${repo} on branch ${branch}`;
      
      // Create details with the content, using JSON.stringify to properly escape once
      const details = {
        message: `File contents of ${path} in ${owner}/${repo} on branch ${branch} have been retrieved:`,
        content
      };

      return {
        success: true,
        content,
        summary,
        details: JSON.stringify(details)
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