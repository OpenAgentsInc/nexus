export interface ToolContext {
  gitHubToken?: string;
  repos?: { owner: string; name: string; branch: string }[];
}