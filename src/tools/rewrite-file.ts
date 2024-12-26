import { CoreTool, tool } from "ai";
import { z } from "zod";
import { ToolContext } from "./types";
import { Octokit } from "@octokit/rest";

const params = z.object({
  path: z.string().describe('The path of the file to rewrite'),
  content: z.string().describe('The new content to write to the file'),
  owner: z.string().describe('The owner of the repository'),
  repo: z.string().describe('The name of the repository'),
  branch: z.string().describe('The branch to update'),
});

type Params = z.infer<typeof params>;

type Result = {
  success: boolean;
  summary: string;
  details: string;
  newContent: string;
  oldContent: string;
};

export const rewriteFileTool = (context: ToolContext): CoreTool<typeof params, Result> => tool({
  description: 'Rewrites the contents of a file at the given path',
  parameters: params,
  execute: async ({ path, content, owner, repo, branch }: Params): Promise<Result> => {
    if (!context.gitHubToken) {
      return {
        success: false,
        summary: 'Failed to rewrite file due to missing github token',
        details: 'The tool context is missing required repository information or GitHub token.',
        newContent: '',
        oldContent: '',
      };
    }

    const octokit = new Octokit({ auth: context.gitHubToken });

    try {
      // Get the current file to retrieve its SHA and content
      const { data: currentFile } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ('sha' in currentFile && 'content' in currentFile) {
        const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf-8');

        // Update the file
        const { data } = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Update ${path}`,
          content: Buffer.from(content).toString('base64'),
          sha: currentFile.sha,
          branch,
        });

        return {
          success: true,
          summary: `Updated ${path}`,
          details: `File ${path} has been successfully updated in ${owner}/${repo} on branch ${branch}. Commit SHA: ${data.commit.sha}`,
          newContent: content,
          oldContent: currentContent,
        };
      } else {
        throw new Error('Unable to retrieve file SHA or content');
      }
    } catch (error) {
      console.error('Error rewriting file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        summary: 'Failed to rewrite file',
        details: `Error: ${errorMessage}`,
        newContent: '',
        oldContent: '',
      };
    }
  },
});