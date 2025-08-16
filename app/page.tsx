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
  const [cursorPosition, setCursorPosition] = useState(0)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [currentTime, setCurrentTime] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [terminalCommands, setTerminalCommands] = useState<TerminalCommands | null>(null)
  const [currentPath, setCurrentPath] = useState('~')
  const [matrixMode, setMatrixMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typedOutput, setTypedOutput] = useState<string[]>([])
  const [serverStartTime] = useState(Date.now())
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Calculate server uptime
  const getServerUptime = () => {
    const uptimeMs = Date.now() - serverStartTime
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Handle terminal click to focus input
  const handleTerminalClick = () => {
    if (inputRef.current && terminalCommands) {
      inputRef.current.focus()
    }
  }



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

  // Update uptime display every second
  useEffect(() => {
    const updateUptime = () => {
      // Force re-render to update uptime display
      setCurrentTime(prev => prev)
    }
    
    const uptimeInterval = setInterval(updateUptime, 1000)
    
    return () => clearInterval(uptimeInterval)
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
                    content: ContentGenerator.generateAbout([]),
                    repo: undefined
                  },
                  {
                    name: 'resume.md',
                    type: 'file' as const,
                    path: '/home/obumbravit/resume.md',
                    content: ContentGenerator.generateResume([]),
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
          '💡 Try: ls ~/projects',
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
      setCursorPosition(0)
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
      setCursorPosition(0)
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
    setCursorPosition(0) // Reset cursor position after command execution
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(currentCommand)
    } else if (e.key === 'ArrowUp' && terminalCommands) {
      e.preventDefault()
      const history = terminalCommands.getHistory('up')
      if (history) {
        setCurrentCommand(history)
        // Set cursor to end when loading from history
        setTimeout(() => {
          setCursorPosition(history.length)
          if (inputRef.current) {
            inputRef.current.setSelectionRange(history.length, history.length)
          }
        }, 0)
      }
    } else if (e.key === 'ArrowDown' && terminalCommands) {
      e.preventDefault()
      const history = terminalCommands.getHistory('down')
      if (history) {
        setCurrentCommand(history)
        // Set cursor to end when loading from history
        setTimeout(() => {
          setCursorPosition(history.length)
          if (inputRef.current) {
            inputRef.current.setSelectionRange(history.length, history.length)
          }
        }, 0)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const newPosition = Math.max(0, cursorPosition - 1)
      setCursorPosition(newPosition)
      // Set the actual cursor position in the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const newPosition = Math.min(currentCommand.length, cursorPosition + 1)
      setCursorPosition(newPosition)
      // Set the actual cursor position in the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCursorPosition(0)
      // Set the actual cursor position in the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, 0)
        }
      }, 0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCursorPosition(currentCommand.length)
      // Set the actual cursor position in the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(currentCommand.length, currentCommand.length)
        }
      }, 0)
    }
  }

  if (!bootComplete) {
    return (
      <div className="h-screen bg-terminal-bg text-terminal-text font-mono flex flex-col safe-area overflow-hidden">
        {/* Matrix Rain Effect */}
        <MatrixRain isActive={false} />
        
        {/* Terminal Header */}
        <div className="flex-shrink-0 responsive-padding border-b border-terminal-border professional-shadow">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Window Controls */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                </div>
                {/* Title */}
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-terminal-accent" />
                  <span className="text-sm sm:text-lg font-bold text-terminal-accent">OBUMBRAVIT_TERMINAL</span>
                </div>
              </div>
              {/* Status Info */}
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <span className="text-terminal-muted">{currentTime}</span>
                <span className="text-terminal-accent animate-pulse">BOOTING...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boot Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto responsive-padding space-responsive terminal-output min-h-0">
              {bootSequence.slice(0, currentStep + 1).map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="whitespace-pre-wrap terminal-text-animate terminal-responsive mb-1"
                >
                  {step.text}
                  {index === currentStep && cursorVisible && (
                    <span className="text-terminal-accent animate-pulse">_</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-terminal-bg text-terminal-text font-mono flex flex-col safe-area overflow-hidden">
      {/* Matrix Rain Effect */}
      <MatrixRain isActive={matrixMode} />
      
      {/* Terminal Header */}
      <div className="flex-shrink-0 responsive-padding border-b border-terminal-border professional-shadow">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Window Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
              </div>
              {/* Title */}
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-terminal-accent" />
                <span className="text-sm sm:text-lg font-bold text-terminal-accent">OBUMBRAVIT_TERMINAL</span>
              </div>
            </div>
            {/* Status Info */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
              <span className="text-terminal-muted">{currentTime}</span>
              {isLoading && <span className="text-terminal-accent animate-pulse">🔄 Loading GitHub...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Content - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full w-full flex flex-col">
          {/* Command History - Scrollable */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto responsive-padding space-responsive terminal-output min-h-0 terminal-clickable"
            onClick={handleTerminalClick}
          >
            {commandHistory.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap terminal-text-animate terminal-responsive">
                {line}
              </div>
            ))}
            {/* Progressive typing output */}
            {isTyping && typedOutput.map((line, index) => (
              <div key={`typing-${index}`} className="whitespace-pre-wrap text-terminal-accent terminal-text-animate terminal-responsive">
                {line}
              </div>
            ))}
            {isTyping && (
              <div className="text-terminal-accent animate-pulse">_</div>
            )}
          </div>

          {/* Command Input - Fixed at bottom */}
          <div className="flex-shrink-0 responsive-padding border-t border-terminal-border professional-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-terminal-accent text-xs sm:text-sm whitespace-nowrap">obumbravit@terminal:{terminalCommands ? terminalCommands.getCurrentPath() : currentPath}$</span>
              <div className="flex-1 relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentCommand}
                  onChange={(e) => {
                    setCurrentCommand(e.target.value)
                    setCursorPosition(e.target.selectionStart || 0)
                  }}
                  onKeyUp={(e) => {
                    // Update cursor position after key events
                    const target = e.target as HTMLInputElement
                    setCursorPosition(target.selectionStart || 0)
                  }}
                  onKeyDown={handleKeyPress}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement
                    setCursorPosition(target.selectionStart || 0)
                  }}
                  onSelect={(e) => {
                    const target = e.target as HTMLInputElement
                    setCursorPosition(target.selectionStart || 0)
                  }}
                  className="w-full bg-transparent text-terminal-text outline-none border-none font-mono terminal-responsive touch-friendly caret-transparent"
                  placeholder=""
                  autoFocus
                  disabled={!terminalCommands}
                />
                <span 
                  className="absolute text-terminal-accent animate-pulse pointer-events-none"
                  style={{ 
                    left: `${cursorPosition * 0.6}em`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  {cursorVisible ? '_' : ' '}
                </span>
              </div>
            </div>

            {/* Quick Commands */}
            {terminalCommands && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 sm:gap-3 md:gap-4">
                {[
                  { cmd: 'ls', icon: FolderOpen, desc: 'List contents' },
                  { cmd: 'cd', icon: MapPin, desc: 'Change directory' },
                  { cmd: 'cat', icon: FileText, desc: 'View file' },
                  { cmd: 'pwd', icon: GitBranch, desc: 'Current path' },
                  { cmd: 'tree', icon: GitBranch, desc: 'Directory tree' },
                  { cmd: 'clear', icon: Trash2, desc: 'Clear terminal' },
                  { cmd: 'reload', icon: RefreshCw, desc: 'Reload GitHub' },
                  { cmd: 'help', icon: HelpCircle, desc: 'Show commands' }
                ].map(({ cmd, icon: Icon, desc }) => (
                  <motion.button
                    key={cmd}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCommand(cmd)}
                    className="p-2 sm:p-3 md:p-4 border border-terminal-border rounded-lg hover:bg-terminal-accent/5 hover:border-terminal-accent/30 smooth-transition professional-hover text-left touch-friendly min-h-[60px] sm:min-h-[70px] md:min-h-[80px]"
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-terminal-accent" />
                      <span className="font-bold text-terminal-accent text-xs sm:text-sm md:text-base">{cmd}</span>
                    </div>
                    <div className="text-xs text-terminal-muted leading-tight">
                      {desc}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Status Bar */}
            <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-terminal-muted space-y-1 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="text-terminal-accent">Status: {terminalCommands ? 'ONLINE' : 'LOADING'}</span>
                <span>Uptime: {getServerUptime()}</span>
                {matrixMode && <span className="text-green-400 animate-pulse">MATRIX ACTIVE</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
