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
  private currentPath: string = '~'
  private commandHistory: string[] = []
  private historyIndex: number = -1

  constructor(fileSystem: FileSystemNode) {
    this.fileSystem = fileSystem
  }

  getCurrentPath(): string {
    // Replace /home/obumbravit with ~ everywhere in the path
    return this.currentPath.replace(/^\/home\/obumbravit/, '~')
  }

  private getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return parts.length > 0 ? '/' + parts.join('/') : '/'
  }

  private resolvePath(path: string): string {
    // Handle tilde expansion
    if (path.startsWith('~')) {
      if (path === '~') {
        return '/home/obumbravit'
      }
      return '/home/obumbravit' + path.slice(1)
    }
    
    // Handle relative paths
    if (!path.startsWith('/')) {
      const currentAbsolute = this.currentPath === '~' ? '/home/obumbravit' : this.currentPath
      return currentAbsolute + '/' + path
    }
    
    return path
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
    // Parse options and paths
    const options: string[] = []
    const paths: string[] = []
    
    for (const arg of args) {
      if (arg.startsWith('-')) {
        options.push(arg)
      } else {
        paths.push(arg)
      }
    }
    
    const showHidden = options.includes('-a') || options.includes('--all')
    const longFormat = options.includes('-l') || options.includes('--long')
    const recursive = options.includes('-R') || options.includes('--recursive')
    const reverse = options.includes('-r') || options.includes('--reverse')
    
    // If no paths specified, use current directory
    const targetPaths = paths.length > 0 ? paths : [currentPath]
    
    const output: string[] = []
    
    for (let i = 0; i < targetPaths.length; i++) {
      const path = targetPaths[i]
      
      // Add header for multiple paths
      if (targetPaths.length > 1) {
        if (i > 0) output.push('')
        output.push(`${path}:`)
      }
      
      const resolvedPath = this.resolvePath(path)
      const node = this.findNode(resolvedPath)
      
      if (!node) {
        output.push(`ls: cannot access '${path}': No such file or directory`)
        continue
      }
      
      if (node.type !== 'directory') {
        if (longFormat) {
          // Show file details
          const size = node.content ? node.content.length : 0
          const date = new Date().toLocaleDateString()
          output.push(`-rw-r--r-- 1 obumbravit obumbravit ${size} ${date} ${node.name}`)
        } else {
          output.push(node.name)
        }
        continue
      }

      const items = node.children || []
      
      // Filter hidden files
      const visibleItems = showHidden ? items : items.filter(item => !item.name.startsWith('.'))
      
      // Add parent directory if not at root and showing all
      if (showHidden && path !== '/') {
        visibleItems.unshift({ name: '..', type: 'directory', path: this.getParentPath(path), children: [] })
      }
      
      // Sort items
      let sortedItems = visibleItems.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1
        if (a.type !== 'directory' && b.type === 'directory') return 1
        return a.name.localeCompare(b.name)
      })
      
      if (reverse) {
        sortedItems = sortedItems.reverse()
      }
      
      if (longFormat) {
        // Long format output
        sortedItems.forEach(item => {
          const size = item.type === 'file' && item.content ? item.content.length : 0
          const date = new Date().toLocaleDateString()
          const permissions = item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--'
          const owner = 'obumbravit'
          const group = 'obumbravit'
          output.push(`${permissions} 1 ${owner} ${group} ${size.toString().padStart(8)} ${date} ${item.name}`)
        })
      } else {
        // Simple format
        sortedItems.forEach(item => {
          let icon = item.type === 'directory' ? '📁' : '📄'
          
          // Check if it's a repository and if it's a fork
          if (item.type === 'directory' && item.repo) {
            // Simple fork detection based on name and description
            const isFork = item.repo.fork || 
                          item.repo.name.toLowerCase().includes('fork') ||
                          item.repo.description?.toLowerCase().includes('fork')
            icon = isFork ? '🔀' : '📁' // Fork icon for forked repos
          }
          
          output.push(`${icon} ${item.name}`)
        })
      }
      
      // Handle recursive listing
      if (recursive) {
        for (const item of sortedItems) {
          if (item.type === 'directory' && item.name !== '..') {
            const subPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`
            const subResult = await this.ls([], fileSystem, subPath)
            if (subResult.output.length > 0) {
              output.push('')
              output.push(`${subPath}:`)
              output.push(...subResult.output)
            }
          }
        }
      }
    }

    return { output }
  }

  private async cd(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    // Handle multiple arguments
    if (args.length > 1) {
      return { output: ['cd: too many arguments'] }
    }

    const path = args[0]
    
    // No arguments - go to home directory
    if (!path) {
      this.currentPath = '~'
      return { output: [] }
    }

    // Handle special cases
    if (path === '-') {
      // Go to previous directory (if we had one)
      return { output: ['cd: OLDPWD not set'] }
    }

    let newPath: string
    
    // Use the new path resolution method
    newPath = this.resolvePath(path)

    // Normalize the path (remove double slashes, etc.)
    newPath = newPath.replace(/\/+/g, '/')
    if (newPath.endsWith('/') && newPath !== '/') {
      newPath = newPath.slice(0, -1)
    }

    // Ensure the path exists and is a directory
    const node = this.findNode(newPath)
    if (!node) {
      return { output: [`cd: ${path}: No such file or directory`] }
    }
    
    if (node.type !== 'directory') {
      return { output: [`cd: ${path}: Not a directory`] }
    }

    this.currentPath = newPath
    return { output: [] }
  }

  private async cat(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { output: ['cat: missing file operand', 'Try \'cat --help\' for more information.'] }
    }

    // Parse options
    const options: string[] = []
    const files: string[] = []
    
    for (const arg of args) {
      if (arg.startsWith('-')) {
        options.push(arg)
      } else {
        files.push(arg)
      }
    }
    
    const showLineNumbers = options.includes('-n') || options.includes('--number')
    const showNonPrinting = options.includes('-A') || options.includes('--show-all')
    const squeezeBlanks = options.includes('-s') || options.includes('--squeeze-blank')
    
    if (options.includes('--help')) {
      return {
        output: [
          'Usage: cat [OPTION]... [FILE]...',
          'Concatenate FILE(s) to standard output.',
          '',
          'With no FILE, or when FILE is -, read standard input.',
          '',
          '  -A, --show-all           equivalent to -vET',
          '  -n, --number             number all output lines',
          '  -s, --squeeze-blank      suppress repeated empty output lines',
          '      --help     display this help and exit',
          '      --version  output version information and exit',
          '',
          'Examples:',
          '  cat f - g  Output f\'s contents, then standard input, then g\'s contents.',
          '  cat        Copy standard input to standard output.'
        ]
      }
    }
    
    if (options.includes('--version')) {
      return { output: ['cat (GNU coreutils) 8.32'] }
    }

    const output: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const filename = files[i]
      
      // Handle stdin (-)
      if (filename === '-') {
        output.push('cat: -: No such file or directory')
        continue
      }
      
      // Add header for multiple files
      if (files.length > 1) {
        if (i > 0) output.push('')
        output.push(`==> ${filename} <==`)
      }
      
      const filePath = this.resolvePath(filename)

      const node = this.findNode(filePath)
      if (!node) {
        output.push(`cat: ${filename}: No such file or directory`)
        continue
      }

      if (node.type !== 'file') {
        output.push(`cat: ${filename}: Is a directory`)
        continue
      }

      let content: string[] = []
      
      // Try to fetch content from GitHub for repository files
      const pathParts = filePath.split('/')
      const projectsIndex = pathParts.indexOf('projects')
      if (projectsIndex !== -1 && projectsIndex + 1 < pathParts.length) {
        const repoName = pathParts[projectsIndex + 1]
        const relativeFilePath = pathParts.slice(projectsIndex + 2).join('/')
        
        const fetchedContent = await fetchFileContent(repoName, relativeFilePath)
        if (fetchedContent) {
          content = fetchedContent.split('\n')
        }
      }
      
      // Fallback to node content if available
      if (content.length === 0 && node.content) {
        content = node.content.split('\n')
      }
      
      if (content.length === 0) {
        output.push(`cat: ${filename}: File content not available`)
        continue
      }
      
      // Apply options
      let processedContent = content
      
      if (squeezeBlanks) {
        processedContent = processedContent.filter((line, index, arr) => {
          if (line.trim() === '') {
            return index === 0 || arr[index - 1].trim() !== ''
          }
          return true
        })
      }
      
      if (showLineNumbers) {
        processedContent = processedContent.map((line, index) => {
          const lineNum = (index + 1).toString().padStart(6) + '  '
          return lineNum + line
        })
      }
      
      if (showNonPrinting) {
        processedContent = processedContent.map(line => {
          return line.replace(/\t/g, '^I')
                    .replace(/\r/g, '^M')
                    .replace(/\n/g, '$')
        })
      }
      
      output.push(...processedContent)
    }
    
    return { output }
  }

  private async pwd(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    return { output: [this.getCurrentPath()] }
  }

  private async tree(args: string[], fileSystem: FileSystemNode, currentPath: string): Promise<CommandResult> {
    // Parse options
    const options: string[] = []
    const paths: string[] = []
    
    for (const arg of args) {
      if (arg.startsWith('-')) {
        options.push(arg)
      } else {
        paths.push(arg)
      }
    }
    
    const showHidden = options.includes('-a') || options.includes('--all-files')
    const showGitignore = options.includes('-I') || options.includes('--gitignore')
    const maxDepth = options.find(opt => opt.startsWith('--max-depth='))?.split('=')[1]
    const maxDepthNum = maxDepth ? parseInt(maxDepth) : undefined
    
    if (options.includes('--help')) {
      return {
        output: [
          'tree - list contents of directories in a tree-like format.',
          '',
          'Usage: tree [options] [directory]',
          '',
          'Options:',
          '  -a            All files are printed.',
          '  -I pattern    Do not list files that match the given pattern.',
          '  --max-depth=N Print directories up to N levels deep.',
          '  --help        Display this help and exit.',
          '  --version     Output version information and exit.',
          '',
          'Examples:',
          '  tree                    # List current directory',
          '  tree ~                  # List home directory',
          '  tree -a                 # Show hidden files',
          '  tree --max-depth=2      # Show only 2 levels deep'
        ]
      }
    }
    
    if (options.includes('--version')) {
      return { output: ['tree v1.8.0'] }
    }

    const targetPath = paths[0] ? this.resolvePath(paths[0]) : (this.currentPath === '~' ? '/home/obumbravit' : this.currentPath)
    const node = this.findNode(targetPath)
    
    if (!node) {
      return { output: [`tree: ${targetPath}: No such file or directory`] }
    }

    if (node.type !== 'directory') {
      return { output: [`tree: ${targetPath}: Not a directory`] }
    }

    const output = this.generateTree(node, '', true, showHidden, maxDepthNum)
    
    // Add summary
    const stats = this.getTreeStats(node, showHidden)
    output.push('')
    output.push(`${stats.dirs} directories, ${stats.files} files`)
    
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
    const command = args[0]
    
    if (command) {
      // Show help for specific command
      const helpTexts: Record<string, string[]> = {
        ls: [
          'ls - list directory contents',
          '',
          'Usage: ls [OPTION]... [FILE]...',
          '',
          'Options:',
          '  -a, --all          do not ignore entries starting with .',
          '  -l, --long         use long listing format',
          '  -R, --recursive    list subdirectories recursively',
          '  -r, --reverse      reverse order while sorting',
          '',
          'Examples:',
          '  ls                 # List current directory',
          '  ls -la             # Long format with hidden files',
          '  ls projects/       # List specific directory',
          '  ls -R              # Recursive listing'
        ],
        cd: [
          'cd - change directory',
          '',
          'Usage: cd [DIRECTORY]',
          '',
          'Change the current directory to DIRECTORY.',
          'If no directory is given, the value of the HOME shell variable is used.',
          '',
          'Examples:',
          '  cd                 # Go to home directory',
          '  cd projects        # Go to projects directory',
          '  cd ..              # Go to parent directory',
          '  cd ~/projects      # Go to projects in home directory'
        ],
        cat: [
          'cat - concatenate files and print on the standard output',
          '',
          'Usage: cat [OPTION]... [FILE]...',
          '',
          'Options:',
          '  -n, --number       number all output lines',
          '  -A, --show-all     equivalent to -vET',
          '  -s, --squeeze-blank  suppress repeated empty output lines',
          '      --help         display this help and exit',
          '',
          'Examples:',
          '  cat file.txt       # Display file contents',
          '  cat -n file.txt    # Display with line numbers',
          '  cat file1 file2    # Display multiple files'
        ],
        tree: [
          'tree - list contents of directories in a tree-like format',
          '',
          'Usage: tree [OPTION]... [DIRECTORY]',
          '',
          'Options:',
          '  -a                 all files are printed',
          '  -I pattern         do not list files that match the given pattern',
          '  --max-depth=N      print directories up to N levels deep',
          '',
          'Examples:',
          '  tree               # Show current directory tree',
          '  tree -a            # Show hidden files too',
          '  tree --max-depth=2 # Show only 2 levels deep'
        ]
      }
      
      const helpText = helpTexts[command]
      if (helpText) {
        return { output: helpText }
      } else {
        return { output: [`No help available for '${command}'`] }
      }
    }
    
    const output = [
      'Available commands:',
      '',
      'File System:',
      '  ls [OPTION]... [FILE]...  - List directory contents',
      '  cd [DIRECTORY]            - Change directory',
      '  cat [OPTION]... [FILE]... - Display file contents',
      '  pwd                       - Print working directory',
      '  tree [OPTION]... [DIR]    - Display directory tree',
      '',
      'System:',
      '  reload                    - Reload filesystem from GitHub',
      '',
      'Special:',
      '  matrix                    - Enter the matrix (easter egg)',
      '',
      'Terminal:',
      '  clear                     - Clear terminal',
      '  help [COMMAND]            - Show help (or help for specific command)',
      '  exit                      - Exit terminal (refresh page)',
      '',
      'Navigation:',
      '  Use arrow keys for command history',
      '  Tab completion available for commands',
      '  Type "help <command>" for detailed usage',
      '',
      'Examples:',
      '  ls -la                    # Long format with hidden files',
      '  cd projects/AirDnD        # Navigate to AirDnD project',
      '  cat -n README.md          # View README with line numbers',
      '  tree -a --max-depth=2     # Show tree with hidden files, 2 levels deep'
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

  private generateTree(node: FileSystemNode, prefix: string, isLast: boolean, showHidden: boolean = false, maxDepth: number = Infinity, currentDepth: number = 0): string[] {
    const output: string[] = []
    const connector = isLast ? '└── ' : '├── '
    const icon = node.type === 'directory' ? '📁' : '📄'
    
    output.push(prefix + connector + icon + ' ' + node.name)

    if (node.children && node.children.length > 0 && currentDepth < maxDepth) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      const visibleChildren = showHidden ? node.children : node.children.filter(child => !child.name.startsWith('.'))
      
      visibleChildren.forEach((child, index) => {
        const isLastChild = index === visibleChildren.length - 1
        output.push(...this.generateTree(child, newPrefix, isLastChild, showHidden, maxDepth, currentDepth + 1))
      })
    }

    return output
  }

  private getTreeStats(node: FileSystemNode, showHidden: boolean = false): { dirs: number, files: number } {
    let dirs = 0
    let files = 0
    
    if (node.type === 'directory') {
      dirs++
      if (node.children) {
        const visibleChildren = showHidden ? node.children : node.children.filter(child => !child.name.startsWith('.'))
        for (const child of visibleChildren) {
          const childStats = this.getTreeStats(child, showHidden)
          dirs += childStats.dirs
          files += childStats.files
        }
      }
    } else {
      files++
    }
    
    return { dirs, files }
  }
}
