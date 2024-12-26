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

export async function githubCreateFile(args: {
  path: string,
  content: string,
  token: string,
  repoOwner: string,
  repoName: string,
  branch: string,
  message?: string
}): Promise<void> {
  const { path, content, token, repoOwner, repoName, branch, message } = args;
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

  await githubApiRequest(url, token, 'PUT', {
    message: message || `Create file ${path}`,
    content: Buffer.from(content).toString('base64'),
    branch
  });
}

export async function githubRewriteFile(args: {
  path: string,
  content: string,
  token: string,
  repoOwner: string,
  repoName: string,
  branch: string,
  message?: string
}): Promise<{ oldContent: string }> {
  const { path, content, token, repoOwner, repoName, branch, message } = args;
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

  // First get the current file to get its SHA
  const currentFile = await githubApiRequest(
    `${url}${branch ? `?ref=${branch}` : ''}`,
    token
  );

  if (!currentFile.sha) {
    throw new Error('Could not get current file SHA');
  }

  const oldContent = Buffer.from(currentFile.content, 'base64').toString('utf-8');

  // Then update the file
  await githubApiRequest(url, token, 'PUT', {
    message: message || `Update ${path}`,
    content: Buffer.from(content).toString('base64'),
    sha: currentFile.sha,
    branch
  });

  return { oldContent };
}