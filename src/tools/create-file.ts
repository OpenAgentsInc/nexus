import { tool, CoreTool } from 'ai';
import { z } from 'zod';
import { githubCreateFile } from '../githubUtils';
import { ToolContext } from './types';

const params = z.object({
  path: z.string().describe('The path where the new file should be created'),
  content: z.string().describe('The content of the new file'),
  owner: z.string().describe('The owner of the repository'),
  repo: z.string().describe('The name of the repository'),
  branch: z.string().describe('The branch to create the file on'),
});

type Params = z.infer<typeof params>;

type Result = {
  success: boolean;
  content: string;
  summary: string;
  details: string;
};

export const createFileTool = (context: ToolContext): CoreTool<typeof params, Result> => tool({
  description: 'Creates a new file at the given path with the provided content',
  parameters: params,
  execute: async ({ path, content, owner, repo, branch }: Params): Promise<Result> => {
    if (!context.gitHubToken) {
      return {
        success: false,
        content: 'Missing GitHub token',
        summary: 'Failed to create file due to missing GitHub token',
        details: 'The tool context is missing the required GitHub token.'
      };
    }

    try {
      await githubCreateFile({
        path,
        content,
        token: context.gitHubToken,
        repoOwner: owner,
        repoName: repo,
        branch
      });

      return {
        success: true,
        content: `File ${path} created successfully.`,
        summary: `Created file at ${path}`,
        details: `File ${path} was created in the repository ${owner}/${repo} on branch ${branch}.`,
      };
    } catch (error) {
      console.error('Error creating file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        content: `Failed to create file ${path}.`,
        summary: `Error creating file at ${path}`,
        details: `Error: ${errorMessage}`,
      };
    }
  },
});