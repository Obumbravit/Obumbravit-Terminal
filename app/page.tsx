'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { 
  Terminal, 
  FolderOpen, 
  FileText, 
  MapPin, 
  GitBranch, 
  Clock, 
  Trash2, 
  HelpCircle,
  RefreshCw
} from 'lucide-react'
import { fetchGitHubRepos } from '@/lib/github'
import { buildFileSystem, FileSystemNode } from '@/lib/github'
import { ContentGenerator } from '@/lib/content-generators'
import { BOOT_MESSAGES, SYSTEM_INFO } from '@/lib/content'
import { TerminalCommands } from '@/lib/terminal-commands'
import MatrixRain from '@/components/MatrixRain'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0)
  const [bootComplete, setBootComplete] = useState(false)
  const [currentCommand, setCurrentCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [currentTime, setCurrentTime] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [terminalCommands, setTerminalCommands] = useState<TerminalCommands | null>(null)
  const [currentPath, setCurrentPath] = useState('/home/obumbravit')
  const [matrixMode, setMatrixMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typedOutput, setTypedOutput] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const bootSequence = [
    { text: `${SYSTEM_INFO.name} ${SYSTEM_INFO.version}`, delay: 200 },
    ...BOOT_MESSAGES.map((message, index) => ({ 
      text: message, 
      delay: 200 + (index * 50) 
    })),
    { text: "System ready.", delay: 200 },
    { text: `Welcome to ${SYSTEM_INFO.terminal}`, delay: 150 },
    { text: "Type 'help' for available commands", delay: 100 },
    { text: "", delay: 50 }
  ]



  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    
    return () => clearInterval(timeInterval)
  }, [])

  // Initialize basic terminal first, then GitHub integration in background
  useEffect(() => {
    const initializeBasicTerminal = () => {
      console.log('🚀 Initializing basic terminal...')
      
      // Create basic file system immediately
      const basicFileSystem: FileSystemNode = {
        name: 'root',
        type: 'directory' as const,
        path: '/',
        children: [
          {
            name: 'home',
            type: 'directory' as const,
            path: '/home',
            children: [
              {
                name: 'obumbravit',
                type: 'directory' as const,
                path: '/home/obumbravit',
                children: [
                  {
                    name: 'about.md',
                    type: 'file' as const,
                    path: '/home/obumbravit/about.md',
                    content: ContentGenerator.generateAbout(),
                    repo: undefined
                  },
                  {
                    name: 'resume.md',
                    type: 'file' as const,
                    path: '/home/obumbravit/resume.md',
                    content: ContentGenerator.generateResume(),
                    repo: undefined
                  },
                  {
                    name: 'contact.txt',
                    type: 'file' as const,
                    path: '/home/obumbravit/contact.txt',
                    content: ContentGenerator.generateContact(),
                    repo: undefined
                  },
                  {
                    name: 'skills.md',
                    type: 'file' as const,
                    path: '/home/obumbravit/skills.md',
                    content: ContentGenerator.generateSkills(),
                    repo: undefined
                  },
                  {
                    name: 'projects',
                    type: 'directory' as const,
                    path: '/home/obumbravit/projects',
                    children: [
                      {
                        name: 'README.md',
                        type: 'file' as const,
                        path: '/home/obumbravit/projects/README.md',
                        content: '# Projects\n\nLoading GitHub repositories...\n\nPlease wait while we fetch your projects.',
                        repo: undefined
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'etc',
            type: 'directory' as const,
            path: '/etc',
            children: [
              {
                name: 'system-info',
                type: 'file' as const,
                path: '/etc/system-info',
                content: ContentGenerator.generateSystemInfo(),
                repo: undefined
              },
              {
                name: 'profile',
                type: 'file' as const,
                path: '/etc/profile',
                content: ContentGenerator.generateProfile(),
                repo: undefined
              }
            ]
          },
          {
            name: 'var',
            type: 'directory' as const,
            path: '/var',
            children: [
              {
                name: 'log',
                type: 'directory' as const,
                path: '/var/log',
                children: [
                  {
                    name: 'terminal.log',
                    type: 'file' as const,
                    path: '/var/log/terminal.log',
                    content: ContentGenerator.generateTerminalLog(),
                    repo: undefined
                  },
                  {
                    name: 'access.log',
                    type: 'file' as const,
                    path: '/var/log/access.log',
                    content: ContentGenerator.generateAccessLog(),
                    repo: undefined
                  }
                ]
              }
            ]
          },
          {
            name: 'usr',
            type: 'directory' as const,
            path: '/usr',
            children: [
              {
                name: 'local',
                type: 'directory' as const,
                path: '/usr/local',
                children: [
                  {
                    name: 'bin',
                    type: 'directory' as const,
                    path: '/usr/local/bin',
                    children: [
                      {
                        name: 'obumbravit',
                        type: 'file' as const,
                        path: '/usr/local/bin/obumbravit',
                        content: ContentGenerator.generateExecutable(),
                        repo: undefined
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
      
      const commands = new TerminalCommands(basicFileSystem)
      setTerminalCommands(commands)
      setCurrentPath(commands.getCurrentPath())
      console.log('✅ Basic terminal initialized')
    }

    const loadGitHubIntegration = async () => {
      try {
        console.log('📡 Starting GitHub integration...')
        setIsLoading(true)
        
        const repos = await fetchGitHubRepos()
        console.log('✅ Fetched repos:', repos.length)
        
        if (repos.length === 0) {
          console.log('⚠️ No repositories found, using basic file system')
          setCommandHistory(prev => [
            ...prev,
            '⚠️ No GitHub repositories found',
            '💡 Using basic file system',
            '💡 Check your GitHub username or try again later',
            ''
          ])
          setIsLoading(false)
          return
        }
        
        const fileSystem = await buildFileSystem(repos)
        console.log('✅ File system built')
        
        const commands = new TerminalCommands(fileSystem)
        setTerminalCommands(commands)
        setCurrentPath(commands.getCurrentPath())
        
        // Add notification that GitHub integration is complete
        setCommandHistory(prev => [
          ...prev,
          '🔄 GitHub integration complete!',
          `📁 Loaded ${repos.length} repositories`,
          '💡 Try: ls /home/obumbravit/projects',
          ''
        ])
        
        console.log('✅ GitHub integration complete')
      } catch (error) {
        console.error('❌ GitHub integration failed:', error)
        // Keep the basic terminal working
        setCommandHistory(prev => [
          ...prev,
          '❌ GitHub integration failed',
          '💡 Basic terminal still available',
          '💡 Try the reload command to retry',
          ''
        ])
      } finally {
        setIsLoading(false)
      }
    }

    if (bootComplete) {
      // Initialize basic terminal immediately
      initializeBasicTerminal()
      
      // Load GitHub integration in background
      setTimeout(() => {
        loadGitHubIntegration()
      }, 1000) // 1 second delay
    }
  }, [bootComplete])

  // Auto-scroll to bottom when command history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [commandHistory, typedOutput])

  useEffect(() => {
    if (currentStep < bootSequence.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, bootSequence[currentStep].delay)
      
      return () => clearTimeout(timer)
    } else if (!bootComplete) {
      setTimeout(() => setBootComplete(true), 500)
    }
  }, [currentStep, bootComplete])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setCursorVisible(prev => !prev)
    }, 500)
    
    return () => clearInterval(cursorTimer)
  }, [])

  const handleCommand = async (command: string) => {
    if (!terminalCommands) return

    const cmd = command.toLowerCase().trim()
    setCommandHistory(prev => [...prev, `> ${command}`])
    
    if (cmd === 'clear') {
      setCommandHistory([])
      setCurrentCommand('')
      return
    }
    
    if (cmd === 'exit') {
      window.location.reload()
      return
    }
    
    if (cmd === 'reload') {
      const result = await terminalCommands.executeCommand(command)
      if (result.output.length > 0) {
        setIsTyping(true)
        setTypedOutput([])
        
        for (let i = 0; i < result.output.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50))
          setTypedOutput(prev => [...prev, result.output[i]])
        }
        
        setTimeout(() => {
          setIsTyping(false)
          setTypedOutput([])
          window.location.reload()
        }, 2000)
      }
      setCurrentCommand('')
      return
    }

    if (cmd === 'matrix') {
      setMatrixMode(true)
      setTimeout(() => setMatrixMode(false), 10000) // Matrix mode for 10 seconds
    }
    
    const result = await terminalCommands.executeCommand(command)
    if (result.output.length > 0) {
      // Progressive typing for command output
      setIsTyping(true)
      setTypedOutput([])
      
      for (let i = 0; i < result.output.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)) // 50ms delay between lines
        setTypedOutput(prev => [...prev, result.output[i]])
        
        // Auto-scroll to bottom
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }
      
      setIsTyping(false)
      setCommandHistory(prev => [...prev, ...result.output])
    }
    
    setCurrentPath(terminalCommands.getCurrentPath())
    setCurrentCommand('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(currentCommand)
    } else if (e.key === 'ArrowUp' && terminalCommands) {
      e.preventDefault()
      const history = terminalCommands.getHistory('up')
      if (history) setCurrentCommand(history)
    } else if (e.key === 'ArrowDown' && terminalCommands) {
      e.preventDefault()
      const history = terminalCommands.getHistory('down')
      if (history) setCurrentCommand(history)
    }
  }

  if (!bootComplete) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono p-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {bootSequence.slice(0, currentStep + 1).map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              {step.text}
              {index === currentStep && cursorVisible && (
                <span className="text-terminal-accent animate-pulse">_</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-terminal-bg text-terminal-text font-mono flex flex-col">
      {/* Matrix Rain Effect */}
      <MatrixRain isActive={matrixMode} />
      
      {/* Terminal Header */}
      <div className="flex-shrink-0 p-4 border-b border-terminal-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Terminal className="w-5 h-5 text-terminal-accent" />
              <span className="text-lg font-bold text-terminal-accent">OBUMBRAVIT_TERMINAL</span>
              <span className="text-sm text-terminal-muted">{currentTime}</span>
              {isLoading && <span className="text-xs text-terminal-accent animate-pulse">🔄 Loading GitHub...</span>}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto flex flex-col">
          {/* Command History - Scrollable */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {commandHistory.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap terminal-text-animate">
                {line}
              </div>
            ))}
            {/* Progressive typing output */}
            {isTyping && typedOutput.map((line, index) => (
              <div key={`typing-${index}`} className="whitespace-pre-wrap text-terminal-accent terminal-text-animate">
                {line}
              </div>
            ))}
            {isTyping && (
              <div className="text-terminal-accent animate-pulse">_</div>
            )}
          </div>

          {/* Command Input - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-terminal-border">
            <div className="flex items-center space-x-2">
              <span className="text-terminal-accent">obumbravit@terminal:{currentPath}$</span>
              <input
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 bg-transparent text-terminal-text outline-none border-none font-mono"
                placeholder="Type a command..."
                autoFocus
                disabled={!terminalCommands}
              />
              {cursorVisible && <span className="text-terminal-accent animate-pulse">_</span>}
            </div>

            {/* Quick Commands */}
            {terminalCommands && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { cmd: 'ls', icon: FolderOpen, desc: 'List directory contents' },
                  { cmd: 'cd', icon: MapPin, desc: 'Change directory' },
                  { cmd: 'cat', icon: FileText, desc: 'Display file contents' },
                  { cmd: 'pwd', icon: GitBranch, desc: 'Print working directory' },
                  { cmd: 'tree', icon: GitBranch, desc: 'Display directory tree' },
                  { cmd: 'clear', icon: Trash2, desc: 'Clear terminal' },
                  { cmd: 'reload', icon: RefreshCw, desc: 'Reload from GitHub' },
                  { cmd: 'help', icon: HelpCircle, desc: 'Show available commands' }
                ].map(({ cmd, icon: Icon, desc }) => (
                  <motion.button
                    key={cmd}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCommand(cmd)}
                    className="p-3 border border-terminal-border rounded-lg hover:bg-terminal-accent/5 hover:border-terminal-accent/30 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4 text-terminal-accent" />
                      <span className="font-bold text-terminal-accent">{cmd}</span>
                    </div>
                    <div className="text-xs text-terminal-muted">
                      {desc}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Status Bar */}
            <div className="mt-4 flex items-center justify-between text-sm text-terminal-muted">
              <div className="flex items-center space-x-4">
                <span className="text-terminal-accent">Status: {terminalCommands ? 'ONLINE' : 'LOADING'}</span>
                <span>Uptime: {Math.floor(Date.now() / 1000)}s</span>
                {matrixMode && <span className="text-green-400 animate-pulse">MATRIX ACTIVE</span>}
              </div>
              <div className="flex items-center space-x-4">
                <span>OBUMBRAVIT_OS v2.1.0</span>
                <span className="text-terminal-accent">Development Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
