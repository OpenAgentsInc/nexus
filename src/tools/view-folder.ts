import { tool, CoreTool } from 'ai';
import { z } from 'zod';
import { githubListContents } from '../githubUtils';
import { ToolContext } from './types';

const params = z.object({
  path: z.string().describe("The path to view the folder contents"),
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
  branch: z.string().describe("The branch to view the folder from"),
});

type Params = z.infer<typeof params>;

type Result = {
  success: boolean;
  contents?: string[];
  error?: string;
  summary: string;
  details: string;
};

export const viewFolderTool = (context: ToolContext): CoreTool<typeof params, Result> => tool({
  description: "View folder contents at path (one level deep)",
  parameters: params,
  execute: async ({ path, owner, repo, branch }: Params): Promise<Result> => {
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