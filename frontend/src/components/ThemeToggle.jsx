import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { SunIcon, MoonIcon } from './Icons'

export default function ThemeToggle({ showLabel = true, className = '', style = {} }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: showLabel ? '6px 14px' : '8px',
        borderRadius: '100px',
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
        color: isDark ? '#f1f5f9' : '#0f172a',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {isDark ? (
        <>
          <SunIcon className="w-4 h-4 text-amber-400" />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <MoonIcon className="w-4 h-4 text-indigo-600" />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  )
}
