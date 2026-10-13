import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { UsersIcon, ShieldIcon } from '../components/Icons'

// A user is considered "Active" only if they logged in within the last 30 minutes
const ACTIVE_THRESHOLD_MINUTES = 30

function getActivityStatus(lastLoginAt, enabled) {
  if (!enabled) return { label: 'Disabled', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
  if (!lastLoginAt) return { label: 'Never Logged In', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' }

  const lastLogin = new Date(lastLoginAt)
  const now = new Date()
  const diffMs = now - lastLogin
  const diffMins = diffMs / 1000 / 60

  if (diffMins <= ACTIVE_THRESHOLD_MINUTES) {
    return { label: '● Active', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)' }
  }
  return { label: '● Inactive', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' }
}

function formatLastSeen(lastLoginAt) {
  if (!lastLoginAt) return '—'
  const d = new Date(lastLoginAt)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 1000 / 60)
  const diffHrs = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatJoined(createdAt) {
  if (!createdAt) return '—'
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // Refresh every 60 s so the "active" status stays current
    const id = setInterval(fetchUsers, 60_000)
    return () => clearInterval(id)
  }, [])

  const activeCount = users.filter(u => {
    const s = getActivityStatus(u.lastLoginAt, u.enabled)
    return s.label === '● Active'
  }).length

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <UsersIcon className="w-6 h-6 text-indigo-400" />
            Security Clearance & User Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
            Role-Based Access Control (RBAC) credentials governing chain-of-custody authorization.
          </p>
        </div>

        {/* Live counters */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 12, padding: '10px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>{activeCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Active Now</div>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12, padding: '10px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)' }}>{users.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Users</div>
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Retrieving authorized personnel...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '12px 16px' }}>User ID</th>
                  <th style={{ padding: '12px 16px' }}>Username</th>
                  <th style={{ padding: '12px 16px' }}>Email Address</th>
                  <th style={{ padding: '12px 16px' }}>Assigned Role</th>
                  <th style={{ padding: '12px 16px' }}>Account Status</th>
                  <th style={{ padding: '12px 16px' }}>Last Seen</th>
                  <th style={{ padding: '12px 16px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const status = getActivityStatus(u.lastLoginAt, u.enabled)
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        #{u.id}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#fff' }}>
                        @{u.username}
                        {currentUser?.username === u.username && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-light)', marginLeft: 6,
                            background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 100 }}>
                            You
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: '0.75rem', padding: '3px 10px', borderRadius: 100, fontWeight: 700,
                          background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.15)'
                            : u.role === 'INVESTIGATOR' ? 'rgba(99,102,241,0.15)'
                            : 'rgba(148,163,184,0.15)',
                          border: `1px solid ${u.role === 'ADMIN' ? 'rgba(239,68,68,0.4)'
                            : u.role === 'INVESTIGATOR' ? 'rgba(99,102,241,0.4)'
                            : 'rgba(148,163,184,0.3)'}`,
                          color: u.role === 'ADMIN' ? '#f87171'
                            : u.role === 'INVESTIGATOR' ? 'var(--accent-light)'
                            : '#94a3b8'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: '0.75rem', padding: '3px 10px', borderRadius: 100, fontWeight: 700,
                          color: status.color, background: status.bg, border: `1px solid ${status.border}`
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatLastSeen(u.lastLoginAt)}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatJoined(u.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No users found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '0 4px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#4ade80' }}>●</span> Active — logged in within last {ACTIVE_THRESHOLD_MINUTES} minutes
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#94a3b8' }}>●</span> Inactive — not recently online
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#f87171' }}>●</span> Disabled — account suspended
        </div>
      </div>
    </div>
  )
}
