import { 
  PROFILE_DATA, 
  TECH_STACK, 
  SKILLS, 
  SERVICES, 
  SYSTEM_INFO, 
  BOOT_MESSAGES, 
  FOOTER_TEXT,
  calculateGitHubStats,
  GitHubStats,
  formatDate,
  formatUptime,
  formatSkills,
  formatTechStack,
  formatServices
} from './content'
import { GitHubRepo } from './github'

export class ContentGenerator {
  static generateAbout(repos: GitHubRepo[] = []): string {
    const stats = calculateGitHubStats(repos)
    
    return `# About ${PROFILE_DATA.name}

## Who I Am
${PROFILE_DATA.title} with ${stats.experience} years of calculated experience based on GitHub repository analysis. Currently employed as a professional full-stack developer at a technology company.

## What I Do
I design and develop modern applications across multiple platforms, from native iOS apps with Swift/SwiftUI to responsive web applications and desktop software. My work combines clean code with beautiful design to create products that users love.

## My Approach
- **User-First Design**: Creating interfaces that are intuitive and delightful
- **Clean Code**: Writing maintainable, scalable, and well-documented code
- **Modern Stack**: Using cutting-edge technologies and best practices
- **Performance Focused**: Building fast, efficient applications

## Current Focus
- ${SERVICES.ios}
- ${SERVICES.web}
- ${SERVICES.desktop}
- ${SERVICES.uiux}
- ${SERVICES.api}

## Technologies (Based on GitHub Analysis)
${formatTechStack(TECH_STACK)}

## Repository Statistics
- **Total Repositories**: ${stats.totalRepos}
- **Total Stars**: ${stats.totalStars.toLocaleString()}
- **Most Popular Language**: ${stats.topLanguages[0]?.language || 'Not available'}

---
${FOOTER_TEXT}`
  }

  static generateResume(repos: GitHubRepo[] = []): string {
    const stats = calculateGitHubStats(repos)
    
    return `# ${PROFILE_DATA.name} - Resume

## Professional Summary
${PROFILE_DATA.title} with ${stats.experience} years of calculated experience based on GitHub repository analysis. Currently employed as a professional full-stack developer at a technology company.

## Specializations
- ${SERVICES.ios}
- ${SERVICES.web}
- ${SERVICES.desktop}
- ${SERVICES.uiux}
- ${SERVICES.api}

## Technical Skills (Calculated from GitHub)
${Object.entries(stats.skills).map(([skill, level]) => 
  `- **${skill.charAt(0).toUpperCase() + skill.slice(1)} Development**: ${level}%`
).join('\n')}

## Core Technologies
${formatTechStack(TECH_STACK)}

## Experience
- **${stats.experience} years** of calculated development experience
- **Full-Stack Development**: Building complete applications across platforms
- **iOS Development**: Native iOS apps with modern Swift/SwiftUI
- **Web Development**: Responsive web applications and APIs
- **Desktop Development**: Cross-platform desktop applications

## GitHub Statistics
- **Total Repositories**: ${stats.totalRepos}
- **Total Stars**: ${stats.totalStars.toLocaleString()}
- **Total Forks**: ${stats.totalForks.toLocaleString()}

## Contact
- Email: ${PROFILE_DATA.email}
- GitHub: ${PROFILE_DATA.github}
- LinkedIn: ${PROFILE_DATA.linkedin}
- Twitter: ${PROFILE_DATA.twitter}

---
${FOOTER_TEXT}`
  }

  static generateContact(): string {
    return `${PROFILE_DATA.name} CONTACT INFORMATION
=====================================

Email: ${PROFILE_DATA.email}
GitHub: ${PROFILE_DATA.github}
LinkedIn: ${PROFILE_DATA.linkedin}
Twitter: ${PROFILE_DATA.twitter}

Professional Services:
${formatServices(SERVICES)}

Experience: ${PROFILE_DATA.experience} Professional Development
Current Status: ${PROFILE_DATA.currentRole}
Availability: ${PROFILE_DATA.availability}

Status: ONLINE
Last Updated: ${formatDate()}`
  }

  static generateSkills(repos: GitHubRepo[] = []): string {
    const stats = calculateGitHubStats(repos)
    
    return `# Technical Skills

## Programming Languages (Calculated from GitHub)
${stats.topLanguages.map(lang => 
  `- **${lang.language}**: ${lang.percentage}% (${lang.lines.toLocaleString()} lines estimated)`
).join('\n')}

## Core Competencies (Based on Repository Analysis)
${Object.entries(stats.skills).map(([skill, level]) => 
  `- **${skill.charAt(0).toUpperCase() + skill.slice(1)} Development**: ${level}%`
).join('\n')}

## Repository Statistics
- **Total Repositories**: ${stats.totalRepos}
- **Total Stars**: ${stats.totalStars.toLocaleString()}
- **Total Forks**: ${stats.totalForks.toLocaleString()}
- **Most Popular Repo**: ${stats.mostActiveRepo}
- **Estimated Experience**: ${stats.experience} years

## Primary Technologies
${formatTechStack(TECH_STACK)}

## Development Experience
- **${stats.experience} Years** of professional development
- **Full-Stack Development**: Building complete applications
- **Cross-Platform Development**: iOS, Web, Desktop
- **Modern Frameworks**: Latest technologies and best practices
- **Performance Focused**: Optimized, scalable solutions

---
${FOOTER_TEXT}`
  }

  static generateSystemInfo(repos: GitHubRepo[] = []): string {
    const stats = calculateGitHubStats(repos)
    
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(repo => `  - ${repo.name} (${repo.stargazers_count} stars)`)
      .join('\n')

    return `${SYSTEM_INFO.name} ${SYSTEM_INFO.version} System Information
===============================================

System Status: ONLINE
Uptime: ${formatUptime()} seconds
Professional Status: EMPLOYED
Development Stack: ACTIVE

Repository Statistics (Real-time from GitHub):
- Total Public Repos: ${stats.totalRepos}
- Total Stars: ${stats.totalStars.toLocaleString()}
- Total Forks: ${stats.totalForks.toLocaleString()}
- Most Popular Repo: ${stats.mostActiveRepo}
- Estimated Experience: ${stats.experience} years

Top Languages (by repository count):
${stats.topLanguages.slice(0, 5).map(lang => 
  `  - ${lang.language}: ${lang.percentage}% (${lang.lines.toLocaleString()} lines)`
).join('\n')}

Top Repositories:
${topRepos}

Development Capabilities (Calculated from GitHub):
${Object.entries(stats.skills).map(([skill, level]) => 
  `- ${skill.charAt(0).toUpperCase() + skill.slice(1)} Development: ENABLED (${level}%)`
).join('\n')}

Professional Experience: ${stats.experience} years
Current Role: Full-Stack Developer
Last Analysis: ${new Date().toLocaleString()}

---
${FOOTER_TEXT}`
  }

  static generateTerminalLog(): string {
    const timestamp = formatDate()
    return `${SYSTEM_INFO.terminal} LOG
============================

${timestamp} - Terminal initialized
${timestamp} - Boot sequence completed
${timestamp} - File system mounted
${timestamp} - GitHub integration active
${timestamp} - Development environment loaded
${timestamp} - iOS tools initialized
${timestamp} - System ready for commands

---
${FOOTER_TEXT}`
  }

  static generateAccessLog(): string {
    const timestamp = formatDate()
    return `${SYSTEM_INFO.name} Access Log
==========================

${timestamp} - Terminal session started
${timestamp} - User authentication successful
${timestamp} - File system mounted
${timestamp} - GitHub integration initialized
${timestamp} - Development environment loaded
${timestamp} - iOS tools initialized
${timestamp} - System ready for user interaction

---
${FOOTER_TEXT}`
  }

  static generateProfile(): string {
    return `# ${SYSTEM_INFO.name} Profile Configuration

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
echo "Welcome to ${SYSTEM_INFO.name} ${SYSTEM_INFO.version}"
echo "${PROFILE_DATA.title}"
echo "Type 'help' for available commands"
echo ""

---
${FOOTER_TEXT}`
  }

  static generateExecutable(): string {
    return `#!/bin/bash
# ${SYSTEM_INFO.terminal} Executable
# Version: ${SYSTEM_INFO.version}

echo "${SYSTEM_INFO.terminal} ${SYSTEM_INFO.version}"
echo "${PROFILE_DATA.title}"
echo ""
echo "Available commands:"
echo "  ls, cd, cat, pwd, tree, clear, help, exit"
echo "  matrix - Enter the matrix (easter egg)"
echo ""
echo "Type 'help' for detailed information"
echo ""

# Start interactive terminal
exec /bin/bash`
  }

  static generateReadme(repo: GitHubRepo): string {
    const topics = repo.topics.join(', ') || 'None'
    const homepage = repo.homepage ? `- **Homepage**: ${repo.homepage}` : ''
    
    return `# ${repo.name}

${repo.description || 'No description available.'}

## Repository Information
- **Language**: ${repo.language || 'Not specified'}
- **Stars**: ${repo.stargazers_count}
- **Forks**: ${repo.forks_count}
- **Last Updated**: ${new Date(repo.updated_at).toLocaleDateString()}
- **Topics**: ${topics}

## Links
- **GitHub**: ${repo.html_url}
${homepage}

---
${FOOTER_TEXT}`
  }

  private static getPrimaryLanguage(repos: GitHubRepo[]): string {
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
}
