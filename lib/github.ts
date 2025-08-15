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
    // Simple, direct approach first
    const response = await fetch('https://api.github.com/users/Obumbravit/repos?per_page=100&sort=updated', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    console.log('📡 API Response status:', response.status)
    
    if (response.ok) {
      const repos: GitHubRepo[] = await response.json()
      console.log('✅ Successfully fetched repos:', repos.length)
      console.log('📋 Repo names:', repos.map(r => r.name))
      return repos.filter(repo => !repo.private)
    }
    
    console.log('❌ API failed, trying scraping...')
    
    // Fallback: Scrape the profile page
    const scrapeResponse = await fetch('https://github.com/Obumbravit?tab=repositories')
    const html = await scrapeResponse.text()
    
    // Look for repository links
    const repoPattern = /href="\/Obumbravit\/([^"]+)"/g
    const matches = html.match(repoPattern)
    
    if (matches) {
      const repoNames = Array.from(new Set(
        matches
          .map(match => match.match(/\/Obumbravit\/([^"]+)/)?.[1])
          .filter(Boolean)
      ))
      
      console.log('🔍 Found repos via scraping:', repoNames)
      
      const repos: GitHubRepo[] = repoNames.map((name, index) => ({
        id: index + 1,
        name: name!,
        description: `Repository: ${name}`,
        html_url: `https://github.com/Obumbravit/${name}`,
        homepage: null,
        language: 'Unknown',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: new Date().toISOString(),
        topics: [],
        private: false
      }))
      
      console.log('✅ Created repo objects:', repos.length)
      return repos
    }
    
    console.log('❌ No repos found via scraping')
    throw new Error('No repositories found')
    
  } catch (error) {
    console.error('💥 Error fetching repos:', error)
    throw error
  }
}

export async function fetchRepoContents(repoName: string, path: string = ''): Promise<FileSystemNode[]> {
  console.log(`📁 Fetching contents for ${repoName}/${path}`)
  
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
    
    // Handle directory - fetch deeper but limit recursion
    const items = await Promise.all(contents.map(async (item: any) => {
      const node: FileSystemNode = {
        name: item.name,
        type: item.type === 'dir' ? 'directory' : 'file',
        path: `${path}/${item.name}`,
        content: undefined
      }
      
      // For directories, fetch one level deeper
      if (item.type === 'dir') {
        const childPath = path ? `${path}/${item.name}` : item.name
        try {
          // Only go one level deeper to avoid rate limits
          const childContents = await fetchRepoContents(repoName, childPath)
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
                content: ContentGenerator.generateAbout()
              },
              {
                name: 'resume.md',
                type: 'file',
                path: '/home/obumbravit/resume.md',
                content: ContentGenerator.generateResume()
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
                    // Fetch actual repository contents
                    const contents = await fetchRepoContents(repo.name)
                    console.log(`✅ Fetched ${contents.length} items for ${repo.name}`)
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
  return `# ${repo.name}

${repo.description || 'No description available.'}

## Repository Information
- **Language**: ${repo.language || 'Not specified'}
- **Stars**: ${repo.stargazers_count}
- **Forks**: ${repo.forks_count}
- **Last Updated**: ${new Date(repo.updated_at).toLocaleDateString()}
- **Topics**: ${repo.topics.join(', ') || 'None'}

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
