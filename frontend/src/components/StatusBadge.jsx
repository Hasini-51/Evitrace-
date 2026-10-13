import React from 'react'
import { CheckCircleIcon, AlertTriangleIcon } from './Icons'

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null

  const s = String(status).toUpperCase()

  let colorStyle = {
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)',
    text: '#818cf8',
    icon: null,
  }

  // Integrity Status
  if (s === 'VERIFIED') {
    colorStyle = {
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: '#4ade80',
      icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
    }
  } else if (s === 'MISMATCH' || s === 'TAMPERED') {
    colorStyle = {
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.5)',
      text: '#f87171',
      icon: <AlertTriangleIcon className="w-3.5 h-3.5" />,
    }
  } else if (s === 'ACTIVE' || s === 'STORED') {
    colorStyle = {
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.3)',
      text: '#38bdf8',
      icon: null,
    }
  } else if (s === 'UNDER_INVESTIGATION' || s === 'ANALYZED') {
    colorStyle = {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      text: '#fbbf24',
      icon: null,
    }
  } else if (s === 'CLOSED' || s === 'ARCHIVED') {
    colorStyle = {
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.25)',
      text: '#94a3b8',
      icon: null,
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '100px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: colorStyle.bg,
        border: `1px solid ${colorStyle.border}`,
        color: colorStyle.text,
        textTransform: 'uppercase',
      }}
    >
      {colorStyle.icon}
      {s.replace(/_/g, ' ')}
    </span>
  )
}
