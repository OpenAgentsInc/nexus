import { CoreTool, tool } from "ai"
import { z } from "zod"
import { githubRewriteFile } from "../githubUtils"
import { ToolContext } from "./types"
import { formatNewlines } from "./utils"

const params = z.object({
  path: z.string().describe("The path of the file to rewrite"),
  content: z.string().describe("The new content to write to the file"),
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
  branch: z.string().describe("The branch to update"),
});

type Params = z.infer<typeof params>;

type Result = {
  success: boolean;
  summary: string;
  details: string;
  newContent: string;
  oldContent: string;
};

export const rewriteFileTool = (context: ToolContext): CoreTool<typeof params, Result> =>
  tool({
    description: "Rewrites the contents of a file at the given path",
    parameters: params,
    execute: async ({ path, content, owner, repo, branch }: Params): Promise<Result> => {
      if (!context.gitHubToken) {
        return {
          success: false,
          summary: "Failed to rewrite file due to missing GitHub token",
          details: "The tool context is missing required repository information or GitHub token.",
          newContent: "",
          oldContent: "",
        };
      }

      try {
        const { oldContent } = await githubRewriteFile({
          path,
          content: formatNewlines(content),
          token: context.gitHubToken,
          repoOwner: owner,
          repoName: repo,
          branch,
        });

        return {
          success: true,
          summary: `Updated ${path}`,
          details: `File ${path} has been successfully updated in ${owner}/${repo} on branch ${branch}.`,
          newContent: content,
          oldContent,
        };
      } catch (error) {
        console.error("Error rewriting file:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          summary: "Failed to rewrite file",
          details: `Error: ${errorMessage}`,
          newContent: "",
          oldContent: "",
        };
      }
    },
  });
