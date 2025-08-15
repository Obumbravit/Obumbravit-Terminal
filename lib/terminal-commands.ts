import { FileSystemNode, GitHubRepo, fetchFileContent } from '@/lib/github'

export interface CommandResult {
  output: string[]
  error?: string
}

export interface Command {
  name: string
  description: string
  usage?: string
  execute: (args: string[], fileSystem: FileSystemNode, currentPath: string) => Promise<CommandResult>
}

export class TerminalCommands {
  private fileSystem: FileSystemNode
  private currentPath: string = '/home/obumbravit'
  private commandHistory: string[] = []
  private historyIndex: number = -1

  constructor(fileSystem: FileSystemNode) {
    this.fileSystem = fileSystem
  }

  getCurrentPath(): string {
    return this.currentPath
  }

  addToHistory(command: string) {
    this.commandHistory.push(command)
    this.historyIndex = this.commandHistory.length
  }

  getHistory(direction: 'up' | 'down'): string | null {
    if (direction === 'up' && this.historyIndex > 0) {
      this.historyIndex--
      return this.commandHistory[this.historyIndex]
    } else if (direction === 'down' && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++
      return this.commandHistory[this.historyIndex]
    }
    return null
  }

  async executeCommand(command: string): Promise<CommandResult> {
    const parts = command.trim().split(' ')
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    this.addToHistory(command)

    const commands: Record<string, Command> = {
      ls: {
        name: 'ls',
        description: 'List directory contents',
        usage: 'ls [path]',
        execute: this.ls.bind(this)
      },
      cd: {
        name: 'cd',
        description: 'Change directory',
        usage: 'cd <path>',
        execute: this.cd.bind(this)
      },
      cat: {
        name: 'cat',
        description: 'Display file contents',
        usage: 'cat <file>',
        execute: this.cat.bind(this)
      },
      pwd: {
        name: 'pwd',
        description: 'Print working directory',
        execute: this.pwd.bind(this)
      },
      tree: {
        name: 'tree',
        description: 'Display directory tree',
        usage: 'tree [path]',
        execute: this.tree.bind(this)
      },
      matrix: {
        name: 'matrix',
        description: 'Enter the matrix',
        execute: this.matrix.bind(this)
      },
      clear: {
        name: 'clear',
        description: 'Clear terminal',
        execute: this.clear.bind(this)
      },
      reload: {
        name: 'reload',
        description: 'Reload filesystem from GitHub',
        execute: this.reload.bind(this)
      },
      help: {
        name: 'help',
        description: 'Show available commands',
        execute: this.help.bind(this)
      },
      exit: {
        name: 'exit',
        description: 'Exit terminal',
        execute: this.exit.bind(this)
      }
    }

    const commandHandler = commands[cmd]
    if (!commandHandler) {
      return {
        output: [`Command not found: ${cmd}`],
        error: 'Command not found'
      }
    }

    try {
      return await commandHandler.execute(args, this.fileSystem, this.currentPath)
    } catch (error) {
      return {
        output: [`Error executing ${cmd}: ${error}`],
        error: error as string
      }
    }
  }

  private async ls(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const path = args[0] || currentPath
    const node = this.findNode(path)
    
    if (!node) {
      return { output: [`ls: cannot access '${path}': No such file or directory`] }
    }
    
    if (node.type !== 'directory') {
      return { output: [`ls: cannot access '${path}': Not a directory`] }
    }

    const items = node.children || []
    
    // Add parent directory if not at root
    const output: string[] = []
    if (path !== '/') {
      output.push('📁 ..')
    }
    
    // Sort directories first, then files
    const sortedItems = items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1
      if (a.type !== 'directory' && b.type === 'directory') return 1
      return a.name.localeCompare(b.name)
    })
    
    sortedItems.forEach(item => {
      const icon = item.type === 'directory' ? '📁' : '📄'
      output.push(`${icon} ${item.name}`)
    })

    return { output }
  }

  private async cd(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const path = args[0]
    if (!path) {
      this.currentPath = '/home/obumbravit'
      return { output: [] }
    }

    let newPath: string
    
    // Handle absolute paths
    if (path.startsWith('/')) {
      newPath = path
    }
    // Handle home directory
    else if (path === '~' || path === '~/') {
      newPath = '/home/obumbravit'
    }
    // Handle relative paths with ../
    else if (path.includes('..')) {
      const currentParts = this.currentPath.split('/').filter(Boolean)
      const pathParts = path.split('/')
      let newParts = [...currentParts]
      
      for (const part of pathParts) {
        if (part === '..') {
          if (newParts.length > 0) {
            newParts.pop()
          }
        } else if (part === '.' || part === '') {
          // Skip current directory or empty parts
          continue
        } else {
          newParts.push(part)
        }
      }
      
      newPath = newParts.length > 0 ? '/' + newParts.join('/') : '/'
    }
    // Handle simple relative paths
    else {
      newPath = this.currentPath + '/' + path
    }

    // Ensure the path exists and is a directory
    const node = this.findNode(newPath)
    if (!node) {
      return { output: [`cd: ${path}: No such file or directory (tried: ${newPath})`] }
    }
    
    if (node.type !== 'directory') {
      return { output: [`cd: ${path}: Not a directory`] }
    }

    this.currentPath = newPath
    return { output: [] }
  }

  private async cat(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const filename = args[0]
    if (!filename) {
      return { output: ['cat: missing file operand'] }
    }

    let filePath: string
    if (filename.startsWith('/')) {
      filePath = filename
    } else {
      filePath = this.currentPath + '/' + filename
    }

    const node = this.findNode(filePath)
    if (!node) {
      return { output: [`cat: ${filename}: No such file or directory`] }
    }

    if (node.type !== 'file') {
      return { output: [`cat: ${filename}: Is a directory`] }
    }

    // Always try to fetch content from GitHub for repository files
    const pathParts = filePath.split('/')
    const projectsIndex = pathParts.indexOf('projects')
    if (projectsIndex !== -1 && projectsIndex + 1 < pathParts.length) {
      const repoName = pathParts[projectsIndex + 1]
      const relativeFilePath = pathParts.slice(projectsIndex + 2).join('/')
      
      const content = await fetchFileContent(repoName, relativeFilePath)
      if (content) {
        return { output: content.split('\n') }
      }
    }
    
    // Fallback to node content if available
    if (node.content) {
      return { output: node.content.split('\n') }
    }
    
    return { output: [`cat: ${filename}: File content not available`] }
  }

  private async pwd(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    return { output: [this.currentPath] }
  }

  private async tree(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const path = args[0] || currentPath
    const node = this.findNode(path)
    
    if (!node) {
      return { output: [`tree: ${path}: No such file or directory`] }
    }

    const output = this.generateTree(node, '', true)
    return { output }
  }



  private async uptime(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const uptime = Math.floor(Date.now() / 1000)
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60
    
    return { 
      output: [`up ${hours}h ${minutes}m ${seconds}s`] 
    }
  }

  private async matrix(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const output = [
      'ENTERING THE MATRIX...',
      '',
      'Wake up, Neo...',
      'The Matrix has you...',
      'Follow the white rabbit.',
      '',
      'Knock, knock, Neo.',
      '',
      'The Matrix is everywhere.',
      'It is all around us.',
      'Even now, in this very room.',
      '',
      'You can see it when you look out your window.',
      'Or when you turn on your television.',
      'You can feel it when you go to work...',
      'When you go to church...',
      'When you pay your taxes.',
      '',
      'It is the world that has been pulled over your eyes.',
      'To blind you from the truth.',
      '',
      'That you are a slave, Neo.',
      'Like everyone else you were born into bondage.',
      'Into a prison that you cannot taste or see or touch.',
      'A prison for your mind.',
      '',
      'Unfortunately, no one can be told what the Matrix is.',
      'You have to see it for yourself.',
      '',
      'This is your last chance.',
      'After this, there is no turning back.',
      '',
      'You take the blue pill - the story ends,',
      'you wake up in your bed and believe whatever you want to believe.',
      '',
      'You take the red pill - you stay in Wonderland',
      'and I show you how deep the rabbit-hole goes.',
      '',
      'Remember: all I\'m offering is the truth. Nothing more.',
      '',
      'MATRIX MODE ACTIVATED',
      'Welcome to the digital world.'
    ]

    return { output }
  }

  private async clear(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    return { output: [] }
  }

  private async reload(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    return {
      output: [
        '🔄 Reloading filesystem from GitHub...',
        '💡 Refreshing page to reload repositories...',
        ''
      ]
    }
  }

  private async help(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    const output = [
      'Available commands:',
      '',
      'File System:',
      '  ls [path]          - List directory contents',
      '  cd <path>          - Change directory (supports .. and ~)',
      '  cat <file>         - Display file contents',
      '  pwd                - Print working directory',
      '  tree [path]        - Display directory tree',
      '',
      'System:',
      '  reload             - Reload filesystem from GitHub',
      '',
      'Special:',
      '  matrix             - Enter the matrix (easter egg)',
      '',
      'Terminal:',
      '  clear              - Clear terminal',
      '  help               - Show this help message',
      '  exit               - Exit terminal (refresh page)',
      '',
      'Navigation:',
      '  Use arrow keys for command history',
      '  Tab completion available for commands',
      '  Type "help <command>" for detailed usage',
      '',
      'Examples:',
      '  cd projects/AirDnD    - Navigate to AirDnD project',
      '  cat README.md         - View README file',
      '  ls /home/obumbravit   - List home directory',
      '  tree projects         - Show project structure'
    ]

    return { output }
  }

  private async exit(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    return { output: ['Exiting terminal...'] }
  }

  private findNode(path: string): FileSystemNode | null {
    const parts = path.split('/').filter(Boolean)
    let current = this.fileSystem

    for (const part of parts) {
      if (!current.children) return null
      const child = current.children.find(c => c.name === part)
      if (!child) return null
      current = child
    }

    return current
  }

  private generateTree(node: FileSystemNode, prefix: string, isLast: boolean): string[] {
    const output: string[] = []
    const connector = isLast ? '└── ' : '├── '
    const icon = node.type === 'directory' ? '📁' : '📄'
    
    output.push(prefix + connector + icon + ' ' + node.name)

    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children!.length - 1
        output.push(...this.generateTree(child, newPrefix, isLastChild))
      })
    }

    return output
  }
}
