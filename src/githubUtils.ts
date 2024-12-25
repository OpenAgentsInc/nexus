import { z } from 'zod';

async function githubApiRequest(url: string, token: string, method: string = 'GET', body?: any): Promise<any> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return response.json();
}

export async function githubReadFile(args: { 
  path: string, 
  token: string, 
  repoOwner: string, 
  repoName: string, 
  branch?: string 
}): Promise<string> {
  const { path, token, repoOwner, repoName, branch } = args;
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}${branch ? `?ref=${branch}` : ''}`;

  const data = await githubApiRequest(url, token);

  if (data.type !== 'file') {
    throw new Error('The path does not point to a file');
  }

  return Buffer.from(data.content, 'base64').toString('utf-8');
}

export async function githubListContents(args: { 
  path: string, 
  token: string, 
  repoOwner: string, 
  repoName: string, 
  branch?: string 
}): Promise<string[]> {
  const { path, token, repoOwner, repoName, branch } = args;
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}${branch ? `?ref=${branch}` : ''}`;

  const data = await githubApiRequest(url, token);

  if (!Array.isArray(data)) {
    throw new Error('The path does not point to a directory');
  }

  return data.map((item: any) => item.name);
}