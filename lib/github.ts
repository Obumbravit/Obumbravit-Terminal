  export interface GitHubRepo {
    id: number
    name: string
    description: string | null
    html_url: string
    homepage: string | null
    language: string | null
    stargazers_count: number
    forks_count: number
    updated_at: string
    topics: string[]
    private: boolean
    fork?: boolean
  }

import { ContentGenerator } from '@/lib/content-generators'

export interface FileSystemNode {
  name: string
  type: 'file' | 'directory'
  path: string
  content?: string
  children?: FileSystemNode[]
  repo?: GitHubRepo
}

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  console.log('🔍 Starting GitHub repo fetch...')
  
  try {
    // Strategy 1: Try GitHub API with different endpoints
    const apiEndpoints = [
      'https://api.github.com/users/Obumbravit/repos?per_page=100&sort=updated',
      'https://api.github.com/users/Obumbravit/repos?per_page=30&sort=updated',
      'https://api.github.com/users/Obumbravit/repos?per_page=10&sort=updated'
    ]
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`📡 Trying API endpoint: ${endpoint}`)
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const repos: GitHubRepo[] = await response.json()
          console.log('✅ Successfully fetched repos via API:', repos.length)
          console.log('📋 All repo names:', repos.map(r => r.name))
          console.log('🔀 Fork status:', repos.map(r => ({ name: r.name, fork: r.fork, private: r.private })))
          
          const publicRepos = repos.filter(repo => !repo.private)
          console.log('📁 Public repos:', publicRepos.length)
          console.log('📁 Public repo names:', publicRepos.map(r => r.name))
          
          return publicRepos.map(repo => ({
            ...repo,
            fork: repo.fork || false
          }))
        }
      } catch (apiError) {
        console.log(`❌ API endpoint failed: ${endpoint}`)
        continue
      }
    }
    
    console.log('🔄 All API endpoints failed, trying web scraping...')
    
    // Strategy 2: Advanced web scraping with multiple approaches
    const scrapingStrategies = [
      // Strategy 2a: Direct profile page scraping
      async () => {
        console.log('📄 Trying direct profile scraping...')
        const response = await fetch('https://github.com/Obumbravit', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        })
        
        if (!response.ok) throw new Error(`Profile scraping failed: ${response.status}`)
        
        const html = await response.text()
        console.log('📄 Profile HTML length:', html.length)
        
        // Extract repos from profile page
        const repoPatterns = [
          /href="\/Obumbravit\/([^"]+)"/g,
          /data-testid="repository-name"[^>]*>([^<]+)</g,
          /<a[^>]*href="\/Obumbravit\/([^"]+)"[^>]*>/g,
          /"\/Obumbravit\/([^"]+)"/g,
          /repository-name[^>]*>([^<]+)</g,
          /<a[^>]*href="\/Obumbravit\/([^"]+)"/g
        ]
        
        for (const pattern of repoPatterns) {
          const matches = html.match(pattern)
          if (matches && matches.length > 0) {
            console.log(`🔍 Pattern found ${matches.length} matches:`, matches.slice(0, 5))
            const repoNames = Array.from(new Set(
              matches
                .map(match => {
                  const nameMatch = match.match(/\/Obumbravit\/([^"]+)/)
                  return nameMatch ? nameMatch[1] : null
                })
                .filter(Boolean)
            ))
            
            console.log('📋 Extracted repo names:', repoNames)
            
            if (repoNames.length > 0) {
              console.log('✅ Found repos via profile scraping:', repoNames)
              return repoNames
            }
          }
        }
        
        throw new Error('No repos found in profile page')
      },
      
      // Strategy 2b: Repositories tab scraping
      async () => {
        console.log('📄 Trying repositories tab scraping...')
        const response = await fetch('https://github.com/Obumbravit?tab=repositories', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        })
        
        if (!response.ok) throw new Error(`Repositories tab scraping failed: ${response.status}`)
        
        const html = await response.text()
        console.log('📄 Repositories tab HTML length:', html.length)
        
        // Multiple patterns to find repos
        const repoPatterns = [
          /<a[^>]*href="\/Obumbravit\/([^"]+)"[^>]*>/g,
          /data-testid="repository-name"[^>]*>([^<]+)</g,
          /href="\/Obumbravit\/([^"]+)"/g,
          /"\/Obumbravit\/([^"]+)"/g,
          /repository-name[^>]*>([^<]+)</g,
          /<a[^>]*href="\/Obumbravit\/([^"]+)"/g
        ]
        
        for (const pattern of repoPatterns) {
          const matches = html.match(pattern)
          if (matches && matches.length > 0) {
            console.log(`🔍 Repo tab pattern found ${matches.length} matches:`, matches.slice(0, 5))
            const repoNames = Array.from(new Set(
              matches
                .map(match => {
                  const nameMatch = match.match(/\/Obumbravit\/([^"]+)/)
                  return nameMatch ? nameMatch[1] : null
                })
                .filter(Boolean)
            ))
            
            console.log('📋 Repo tab extracted names:', repoNames)
            
            if (repoNames.length > 0) {
              console.log('✅ Found repos via repositories tab:', repoNames)
              return repoNames
            }
          }
        }
        
        throw new Error('No repos found in repositories tab')
      },
      
      // Strategy 2c: GitHub search API (public, no auth required)
      async () => {
        console.log('🔍 Trying GitHub search...')
        const response = await fetch('https://api.github.com/search/repositories?q=user:Obumbravit&sort=updated&order=desc', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const repoNames = data.items?.map((item: any) => item.name) || []
          console.log('✅ Found repos via search:', repoNames)
          return repoNames
        }
        
        throw new Error('Search API failed')
      },
      
      // Strategy 2d: Look for fork indicators in profile
      async () => {
        console.log('🔍 Looking for fork indicators...')
        const response = await fetch('https://github.com/Obumbravit', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          
          // Look for fork-related content
          const forkPatterns = [
            /forked from[^>]*>([^<]+)</g,
            /forked[^>]*>([^<]+)</g,
            /data-testid="fork-button"[^>]*>([^<]+)</g
          ]
          
          const forkRepos: string[] = []
          for (const pattern of forkPatterns) {
            const matches = html.match(pattern)
            if (matches) {
              console.log('🔀 Found fork indicators:', matches)
              // Extract repo names from fork indicators
              const repoMatches = html.match(/\/Obumbravit\/([^"]+)/g)
              if (repoMatches) {
                const repoNames = Array.from(new Set(
                  repoMatches.map(match => match.replace('/Obumbravit/', ''))
                ))
                console.log('🔀 Potential fork repos:', repoNames)
                return repoNames
              }
            }
          }
        }
        
        throw new Error('No fork indicators found')
      }
    ]
    
    // Try each scraping strategy
    for (const strategy of scrapingStrategies) {
      try {
        const repoNames = await strategy()
        if (repoNames && repoNames.length > 0) {
          const repos: GitHubRepo[] = repoNames.map((name: string, index: number) => ({
            id: index + 1,
            name: name,
            description: `Repository: ${name}`,
            html_url: `https://github.com/Obumbravit/${name}`,
            homepage: null,
            language: 'Unknown',
            stargazers_count: 0,
            forks_count: 0,
            updated_at: new Date().toISOString(),
            topics: [],
            private: false,
            fork: false // We'll detect forks in the content generation
          }))
          
          console.log('✅ Created repo objects:', repos.length)
          return repos
        }
      } catch (strategyError) {
        console.log(`❌ Strategy failed:`, strategyError)
        continue
      }
    }
    
    // Strategy 3: Dynamic repository discovery
    console.log('🔄 Trying dynamic repository discovery...')
    const commonRepoNames = [
      'portfolio', 'website', 'blog', 'app', 'project', 'demo', 'test',
      'obumbravit-terminal', 'terminal', 'personal', 'resume', 'cv',
      'github-io', 'io', 'site', 'web', 'frontend', 'backend', 'fullstack',
      'fork', 'forked', 'clone', 'copy', 'duplicate'
    ]
    
    const discoveredRepos: string[] = []
    
    for (const repoName of commonRepoNames) {
      try {
        const response = await fetch(`https://github.com/Obumbravit/${repoName}`, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          discoveredRepos.push(repoName)
          console.log(`✅ Discovered repo: ${repoName}`)
        }
      } catch (error) {
        // Repo doesn't exist, continue
        continue
      }
    }
    
    if (discoveredRepos.length > 0) {
      console.log('✅ Dynamic discovery found repos:', discoveredRepos)
      const repos: GitHubRepo[] = discoveredRepos.map((name: string, index: number) => ({
        id: index + 1,
        name: name,
        description: `Repository: ${name}`,
        html_url: `https://github.com/Obumbravit/${name}`,
        homepage: null,
        language: 'Unknown',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: new Date().toISOString(),
        topics: [],
        private: false,
        fork: false // We'll detect forks in the content generation
      }))
      
      return repos
    }
    
    throw new Error('All strategies failed')
    
  } catch (error) {
    console.error('💥 All GitHub fetching strategies failed:', error)
    
    // Final fallback: Return empty array to use basic file system
    console.log('🔄 Using basic file system as final fallback')
    return []
  }
}

export async function fetchRepoContents(repoName: string, path: string = '', maxDepth: number = 10, currentDepth: number = 0): Promise<FileSystemNode[]> {
  console.log(`📁 Fetching contents for ${repoName}/${path} (depth: ${currentDepth})`)
  
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    console.log(`⚠️ Max depth reached for ${repoName}/${path}`)
    return []
  }
  
  try {
    const url = `https://api.github.com/repos/Obumbravit/${repoName}/contents/${path}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    console.log(`📡 API Response for ${repoName}/${path}:`, response.status)
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch contents for ${repoName}/${path}: ${response.status}`)
      return []
    }
    
    const contents = await response.json()
    
    // Handle single file
    if (!Array.isArray(contents)) {
      console.log(`📄 Single file found: ${contents.name}`)
      return [{
        name: contents.name,
        type: 'file',
        path: `${path}/${contents.name}`,
        content: contents.content ? atob(contents.content) : undefined
      }]
    }
    
    console.log(`📋 Found ${contents.length} items in ${repoName}/${path}`)
    
    // Handle directory - fetch recursively with delay to avoid rate limits
    const items = await Promise.all(contents.map(async (item: any, index: number) => {
      const node: FileSystemNode = {
        name: item.name,
        type: item.type === 'dir' ? 'directory' : 'file',
        path: `${path}/${item.name}`,
        content: undefined
      }
      
      // For directories, fetch recursively
      if (item.type === 'dir') {
        const childPath = path ? `${path}/${item.name}` : item.name
        
        // Add delay between requests to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        try {
          const childContents = await fetchRepoContents(repoName, childPath, maxDepth, currentDepth + 1)
          node.children = childContents
          console.log(`📂 Fetched ${childContents.length} items for ${repoName}/${childPath}`)
        } catch (error) {
          console.warn(`⚠️ Could not fetch deeper contents for ${repoName}/${childPath}:`, error)
          node.children = []
        }
      }
      
      return node
    }))
    
    console.log(`✅ Created ${items.length} nodes for ${repoName}/${path}`)
    return items
  } catch (error) {
    console.error(`💥 Error fetching contents for ${repoName}/${path}:`, error)
    return []
  }
}

// More aggressive repository content fetching
export async function fetchRepoContentsAggressive(repoName: string): Promise<FileSystemNode[]> {
  console.log(`🚀 Starting aggressive fetch for ${repoName}`)
  
  try {
    // Try to get the default branch first
    const repoResponse = await fetch(`https://api.github.com/repos/Obumbravit/${repoName}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    let defaultBranch = 'main'
    if (repoResponse.ok) {
      const repoData = await repoResponse.json()
      defaultBranch = repoData.default_branch || 'main'
    }
    
    // Use Git Trees API to get complete repository structure
    const treeResponse = await fetch(`https://api.github.com/repos/Obumbravit/${repoName}/git/trees/${defaultBranch}?recursive=1`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (treeResponse.ok) {
      const treeData = await treeResponse.json()
      const tree = treeData.tree || []
      
      console.log(`🌳 Found ${tree.length} items in tree for ${repoName}`)
      
      // Convert tree to FileSystemNode structure
      const nodes: FileSystemNode[] = []
      const nodeMap = new Map<string, FileSystemNode>()
      
      // First pass: create all nodes
      tree.forEach((item: any) => {
        const pathParts = item.path.split('/')
        const name = pathParts[pathParts.length - 1]
        const isDirectory = item.type === 'tree'
        
        const node: FileSystemNode = {
          name,
          type: isDirectory ? 'directory' : 'file',
          path: item.path,
          children: isDirectory ? [] : undefined
        }
        
        nodeMap.set(item.path, node)
      })
      
      // Second pass: build hierarchy
      tree.forEach((item: any) => {
        const node = nodeMap.get(item.path)!
        const pathParts = item.path.split('/')
        
        if (pathParts.length === 1) {
          // Root level item
          nodes.push(node)
        } else {
          // Child item
          const parentPath = pathParts.slice(0, -1).join('/')
          const parent = nodeMap.get(parentPath)
          if (parent && parent.children) {
            parent.children.push(node)
          }
        }
      })
      
      console.log(`✅ Aggressive fetch created ${nodes.length} root nodes for ${repoName}`)
      return nodes
    }
    
    // Fallback to regular fetch
    console.log(`🔄 Falling back to regular fetch for ${repoName}`)
    return await fetchRepoContents(repoName, '', 20, 0)
    
  } catch (error) {
    console.error(`💥 Error in aggressive fetch for ${repoName}:`, error)
    // Fallback to regular fetch
    return await fetchRepoContents(repoName, '', 20, 0)
  }
}

export async function fetchFileContent(repoName: string, filePath: string): Promise<string | null> {
  console.log(`📄 Fetching file content for ${repoName}/${filePath}`)
  
  try {
    // Strategy 1: GitHub API
    const url = `https://api.github.com/repos/Obumbravit/${repoName}/contents/${filePath}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (response.ok) {
      const file = await response.json()
      if (file.content) {
        console.log(`✅ Successfully fetched content via API for ${repoName}/${filePath}`)
        return atob(file.content)
      }
    }
    
    // Strategy 2: Raw GitHub content
    console.log(`🔄 Trying raw content for ${repoName}/${filePath}...`)
    
    // Try main branch first
    const rawUrl = `https://raw.githubusercontent.com/Obumbravit/${repoName}/main/${filePath}`
    const rawResponse = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (rawResponse.ok) {
      const content = await rawResponse.text()
      console.log(`✅ Successfully fetched content via raw URL for ${repoName}/${filePath}`)
      return content
    }
    
    // Try master branch
    const masterUrl = `https://raw.githubusercontent.com/Obumbravit/${repoName}/master/${filePath}`
    const masterResponse = await fetch(masterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (masterResponse.ok) {
      const content = await masterResponse.text()
      console.log(`✅ Successfully fetched content via master branch for ${repoName}/${filePath}`)
      return content
    }
    
    console.error(`❌ Failed to fetch content for ${repoName}/${filePath}`)
    return null
    
  } catch (error) {
    console.error(`💥 Error fetching file content for ${repoName}/${filePath}:`, error)
    return null
  }
}

export async function buildFileSystem(repos: GitHubRepo[]): Promise<FileSystemNode> {
  console.log('🏗️ Building complete file system with repos:', repos.length)
  
  const root: FileSystemNode = {
    name: 'root',
    type: 'directory',
    path: '/',
    children: [
      {
        name: 'home',
        type: 'directory',
        path: '/home',
        children: [
          {
            name: 'obumbravit',
            type: 'directory',
            path: '/home/obumbravit',
            children: [
              {
                name: 'about.md',
                type: 'file',
                path: '/home/obumbravit/about.md',
                content: ContentGenerator.generateAbout(repos)
              },
              {
                name: 'resume.md',
                type: 'file',
                path: '/home/obumbravit/resume.md',
                content: ContentGenerator.generateResume(repos)
              },
              {
                name: 'contact.txt',
                type: 'file',
                path: '/home/obumbravit/contact.txt',
                content: ContentGenerator.generateContact()
              },
              {
                name: 'skills.md',
                type: 'file',
                path: '/home/obumbravit/skills.md',
                content: ContentGenerator.generateSkills(repos)
              },
              {
                name: 'projects',
                type: 'directory',
                path: '/home/obumbravit/projects',
                children: await Promise.all(repos.map(async repo => {
                  console.log(`📂 Processing repo: ${repo.name}`)
                  try {
                    // Fetch complete repository contents with higher depth limit
                    const contents = await fetchRepoContents(repo.name, '', 20, 0)
                    console.log(`✅ Fetched ${contents.length} items for ${repo.name}`)
                    
                    // If we got very few items, try a more aggressive approach
                    if (contents.length < 5) {
                      console.log(`🔄 Trying aggressive fetch for ${repo.name}...`)
                      const aggressiveContents = await fetchRepoContentsAggressive(repo.name)
                      if (aggressiveContents.length > contents.length) {
                        console.log(`✅ Aggressive fetch got ${aggressiveContents.length} items for ${repo.name}`)
                        return {
                          name: repo.name,
                          type: 'directory' as const,
                          path: `/home/obumbravit/projects/${repo.name}`,
                          repo,
                          children: aggressiveContents
                        }
                      }
                    }
                    
                    return {
                      name: repo.name,
                      type: 'directory' as const,
                      path: `/home/obumbravit/projects/${repo.name}`,
                      repo,
                      children: contents
                    }
                  } catch (error) {
                    console.error(`❌ Failed to fetch contents for ${repo.name}:`, error)
                    // Create a basic repo directory with README
                    return {
                      name: repo.name,
                      type: 'directory' as const,
                      path: `/home/obumbravit/projects/${repo.name}`,
                      repo,
                      children: [
                        {
                          name: 'README.md',
                          type: 'file' as const,
                          path: `/home/obumbravit/projects/${repo.name}/README.md`,
                          content: ContentGenerator.generateReadme(repo),
                          repo: repo
                        }
                      ]
                    }
                  }
                }))
              }
            ]
          }
        ]
      },
      {
        name: 'etc',
        type: 'directory',
        path: '/etc',
        children: [
          {
            name: 'system-info',
            type: 'file',
            path: '/etc/system-info',
            content: ContentGenerator.generateSystemInfo(repos)
          },
          {
            name: 'profile',
            type: 'file',
            path: '/etc/profile',
            content: ContentGenerator.generateProfile()
          }
        ]
      },
      {
        name: 'var',
        type: 'directory',
        path: '/var',
        children: [
          {
            name: 'log',
            type: 'directory',
            path: '/var/log',
            children: [
              {
                name: 'terminal.log',
                type: 'file',
                path: '/var/log/terminal.log',
                content: ContentGenerator.generateTerminalLog()
              },
              {
                name: 'access.log',
                type: 'file',
                path: '/var/log/access.log',
                content: ContentGenerator.generateAccessLog()
              }
            ]
          }
        ]
      },
      {
        name: 'usr',
        type: 'directory',
        path: '/usr',
        children: [
          {
            name: 'local',
            type: 'directory',
            path: '/usr/local',
            children: [
              {
                name: 'bin',
                type: 'directory',
                path: '/usr/local/bin',
                children: [
                  {
                    name: 'obumbravit',
                    type: 'file',
                    path: '/usr/local/bin/obumbravit',
                    content: ContentGenerator.generateExecutable()
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  
  console.log('✅ Complete file system built successfully')
  return root
}

function generateReadme(repo: GitHubRepo): string {
  // Simple fork detection based on common fork patterns
  const isFork = repo.name.toLowerCase().includes('fork') || 
                 repo.description?.toLowerCase().includes('fork') ||
                 repo.html_url.includes('fork')
  
  return `# ${repo.name}

${repo.description || 'No description available.'}

## Repository Information
- **Language**: ${repo.language || 'Not specified'}
- **Stars**: ${repo.stargazers_count}
- **Forks**: ${repo.forks_count}
- **Last Updated**: ${new Date(repo.updated_at).toLocaleDateString()}
- **Topics**: ${repo.topics.join(', ') || 'None'}
${isFork ? '- **Type**: Forked Repository' : ''}

## Links
- **GitHub**: ${repo.html_url}
${repo.homepage ? `- **Homepage**: ${repo.homepage}` : ''}

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

function generatePackageJson(repo: GitHubRepo): string {
  return `{
  "name": "${repo.name}",
  "description": "${repo.description || 'No description available.'}",
  "version": "1.0.0",
  "language": "${repo.language || 'Not specified'}",
  "repository": {
    "type": "git",
    "url": "${repo.html_url}"
  },
  "stats": {
    "stars": ${repo.stargazers_count},
    "forks": ${repo.forks_count},
    "lastUpdated": "${repo.updated_at}"
  },
  "topics": ${JSON.stringify(repo.topics, null, 2)}
}`
}

function generateResume(): string {
  return `# OBUMBRAVIT - Resume

## Professional Summary
Full-stack developer with 6+ years of experience specializing in iOS, web, and desktop application development. Currently employed as a professional full-stack developer at a technology company.

## Specializations
- iOS Development (Swift/SwiftUI)
- Full-Stack Web Development
- Desktop Application Development
- Modern UI/UX Design
- API Development & Integration

## Technical Skills
- **iOS Development**: 95%
- **Web Development**: 92%
- **Desktop Development**: 88%
- **UI/UX Design**: 90%
- **API Development**: 93%
- **Database Design**: 87%
- **Performance Optimization**: 89%
- **System Architecture**: 91%

## Core Technologies
- **iOS**: Swift, SwiftUI, Objective-C, UIKit
- **Web**: React, Next.js, TypeScript, JavaScript, HTML5, CSS3
- **Desktop**: Various frameworks and languages
- **Databases**: PostgreSQL, MongoDB, SQLite
- **Tools**: Git, Docker, Xcode, VS Code

## Experience
- **6+ Years** of professional development experience
- **Full-Stack Development**: Building complete applications across platforms
- **iOS Development**: Native iOS apps with modern Swift/SwiftUI
- **Web Development**: Responsive web applications and APIs
- **Desktop Development**: Cross-platform desktop applications

## Contact
- Email: hello@obumbravit.com
- GitHub: github.com/obumbravit
- LinkedIn: linkedin.com/in/obumbravit
- Twitter: @obumbravit

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

function generateContact(): string {
  return `OBUMBRAVIT CONTACT INFORMATION
=====================================

Email: hello@obumbravit.com
GitHub: github.com/obumbravit
LinkedIn: linkedin.com/in/obumbravit
Twitter: @obumbravit

Professional Services:
- iOS Development (Swift/SwiftUI)
- Full-Stack Web Development
- Desktop Application Development
- Modern UI/UX Design
- API Development & Integration
- System Architecture
- Performance Optimization

Experience: 6+ Years Professional Development
Current Status: Employed Full-Stack Developer
Availability: Limited (Currently employed)

Status: ONLINE
Last Updated: ${new Date().toISOString()}
`
}

export function generateSystemInfo(repos: GitHubRepo[] = []): string {
  return `OBUMBRAVIT_OS v2.1.0 System Information
===============================================

System Status: ONLINE
Uptime: ${Math.floor(Date.now() / 1000)} seconds
Professional Status: EMPLOYED
Development Stack: ACTIVE

Repository Statistics:
- Total Public Repos: ${repos.length}
- Total Stars: ${repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
- Total Forks: ${repos.reduce((sum, repo) => sum + repo.forks_count, 0)}
- Primary Language: ${getPrimaryLanguage(repos)}

Top Repositories:
${repos
  .sort((a, b) => b.stargazers_count - a.stargazers_count)
  .slice(0, 5)
  .map(repo => `  - ${repo.name} (${repo.stargazers_count} stars)`)
  .join('\n')}

Development Capabilities:
- iOS Development: ENABLED (Swift/SwiftUI)
- Web Development: ENABLED (React/Next.js)
- Desktop Development: ENABLED
- Full-Stack Development: ENABLED
- UI/UX Design: ENABLED
- API Development: ENABLED

Professional Experience: 6+ Years
Current Role: Full-Stack Developer

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

export function generateTerminalLog(): string {
  return `OBUMBRAVIT_TERMINAL LOG
============================

${new Date().toISOString()} - Terminal initialized
${new Date().toISOString()} - Boot sequence completed
${new Date().toISOString()} - File system mounted
${new Date().toISOString()} - GitHub integration active
${new Date().toISOString()} - Development environment loaded
${new Date().toISOString()} - iOS tools initialized
${new Date().toISOString()} - System ready for commands

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

function getPrimaryLanguage(repos: GitHubRepo[]): string {
  const languages = repos
    .map(repo => repo.language)
    .filter(Boolean) as string[]
  
  const languageCount = languages.reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const primary = Object.entries(languageCount)
    .sort(([,a], [,b]) => b - a)[0]
  
  return primary ? primary[0] : 'Not specified'
}



function generateAbout(): string {
  return `# About OBUMBRAVIT

## Who I Am
Full-stack developer with 6+ years of professional experience specializing in iOS, web, and desktop application development. Currently employed as a professional full-stack developer at a technology company.

## What I Do
I design and develop modern applications across multiple platforms, from native iOS apps with Swift/SwiftUI to responsive web applications and desktop software. My work combines clean code with beautiful design to create products that users love.

## My Approach
- **User-First Design**: Creating interfaces that are intuitive and delightful
- **Clean Code**: Writing maintainable, scalable, and well-documented code
- **Modern Stack**: Using cutting-edge technologies and best practices
- **Performance Focused**: Building fast, efficient applications

## Current Focus
- iOS Development (Swift/SwiftUI)
- Full-Stack Web Development
- Desktop Application Development
- Modern UI/UX Design
- API Development & Integration

## Technologies
- **iOS**: Swift, SwiftUI, Objective-C, UIKit
- **Web**: React, Next.js, TypeScript, JavaScript, HTML5, CSS3
- **Desktop**: Various frameworks and languages
- **Databases**: PostgreSQL, MongoDB, SQLite
- **Tools**: Git, Docker, Xcode, VS Code

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

function generateSkills(repos: GitHubRepo[]): string {
  const languages = repos
    .map(repo => repo.language)
    .filter(Boolean) as string[]
  
  const languageCount = languages.reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topLanguages = Object.entries(languageCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)

  return `# Technical Skills

## Programming Languages (From GitHub)
${topLanguages.map(([lang, count]) => `- **${lang}**: ${count} projects`).join('\n')}

## Core Competencies
- **iOS Development**: Native iOS apps with Swift/SwiftUI
- **Full-Stack Web Development**: End-to-end web applications
- **Desktop Development**: Cross-platform desktop applications
- **UI/UX Design**: Modern, intuitive user interfaces
- **API Development**: RESTful and GraphQL APIs
- **Database Design**: Relational and NoSQL databases
- **Performance Optimization**: Fast, efficient applications
- **System Architecture**: Scalable, maintainable systems

## Primary Technologies
- **iOS**: Swift, SwiftUI, Objective-C, UIKit
- **Web**: React, Next.js, TypeScript, JavaScript, HTML5, CSS3
- **Desktop**: Various frameworks and languages
- **Databases**: PostgreSQL, MongoDB, SQLite
- **Tools**: Git, Docker, Xcode, VS Code

## Development Experience
- **6+ Years** of professional development
- **Full-Stack Development**: Building complete applications
- **Cross-Platform Development**: iOS, Web, Desktop
- **Modern Frameworks**: Latest technologies and best practices
- **Performance Focused**: Optimized, scalable solutions

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

export function generateProfile(): string {
  return `# OBUMBRAVIT_OS Profile Configuration

export PATH="/usr/local/bin:$PATH"
export EDITOR="code"
export TERM="xterm-256color"
export LANG="en_US.UTF-8"

# Development aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias dev='npm run dev'
alias build='npm run build'
alias start='npm start'
alias test='npm test'

# Git aliases
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline'

# Terminal colors
export PS1="\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "

# Welcome message
echo "Welcome to OBUMBRAVIT_OS v2.1.0"
echo "Full-Stack Developer & iOS Specialist"
echo "Type 'help' for available commands"
echo ""

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

export function generateAccessLog(): string {
  return `OBUMBRAVIT_OS Access Log
==========================

${new Date().toISOString()} - Terminal session started
${new Date().toISOString()} - User authentication successful
${new Date().toISOString()} - File system mounted
${new Date().toISOString()} - GitHub integration initialized
${new Date().toISOString()} - Development environment loaded
${new Date().toISOString()} - iOS tools initialized
${new Date().toISOString()} - System ready for user interaction

---
*Generated by OBUMBRAVIT_TERMINAL*
`
}

function generateExecutable(): string {
  return `#!/bin/bash
# OBUMBRAVIT Terminal Executable
# Version: 2.1.0

echo "OBUMBRAVIT Terminal v2.1.0"
echo "Full-Stack Developer & iOS Specialist"
echo ""
echo "Available commands:"
echo "  ls, cd, cat, pwd, tree, top, ps, whoami, date, uptime"
echo "  matrix, clear, help, exit"
echo ""
echo "Type 'help' for detailed information"
echo ""

# Start interactive terminal
exec /bin/bash
`
}
