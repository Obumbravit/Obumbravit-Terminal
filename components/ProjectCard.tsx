'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Github } from 'lucide-react'
import Image from 'next/image'

interface ProjectCardProps {
  title: string
  description: string
  tech: string[]
  image?: string
  liveUrl?: string
  githubUrl?: string
  index: number
}

export default function ProjectCard({
  title,
  description,
  tech,
  image,
  liveUrl,
  githubUrl,
  index
}: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="glass-effect-strong rounded-xl p-6 card-hover group neon-border"
    >
              <div className="relative h-48 bg-gradient-to-br from-void-black to-deep-green rounded-lg mb-4 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-neon-green font-mono text-sm">PROJECT_PREVIEW</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2 group-hover:text-neon-green transition-colors font-mono">
        {title}
      </h3>
      <p className="text-gray-300 mb-4 leading-relaxed">{description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tech.map((techItem, techIndex) => (
          <span
            key={techIndex}
            className="px-3 py-1 bg-neon-green/10 text-neon-green text-sm rounded-full font-mono"
          >
            {techItem}
          </span>
        ))}
      </div>
      
      <div className="flex gap-3">
        {liveUrl && (
                      <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neon-green hover:text-dark-neon transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-mono">LIVE_DEMO</span>
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neon-green hover:text-dark-neon transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-mono">SOURCE_CODE</span>
            </a>
        )}
      </div>
    </motion.div>
  )
}
