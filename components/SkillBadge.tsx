'use client'

import { motion } from 'framer-motion'

interface SkillBadgeProps {
  skill: string
  level: number
  index: number
}

export default function SkillBadge({ skill, level, index }: SkillBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex items-center space-x-3 p-4 glass-effect-strong rounded-lg hover:bg-neon-green/5 transition-colors neon-border"
    >
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-sm text-neon-green">{skill}</span>
          <span className="text-xs text-gray-400">{level}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${level}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
            viewport={{ once: true }}
            className="h-2 bg-gradient-to-r from-neon-green to-dark-neon rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
}
