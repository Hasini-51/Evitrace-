import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { UsersIcon, CheckCircleIcon } from './Icons'

export default function AssignInvestigatorModal({ isOpen, onClose, caseItem, onAssigned }) {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      api.get('/users')
        .then(res => setUsers(res.data))
        .catch(console.error)
      setSelectedUserId(caseItem?.assignedInvestigatorId ? String(caseItem.assignedInvestigatorId) : '')
      setError(null)
    }
  }, [isOpen, caseItem])

  if (!isOpen || !caseItem) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        investigatorId: selectedUserId ? Number(selectedUserId) : null,
      }
      const res = await api.post(`/cases/${caseItem.id}/assign`, payload)
      onAssigned && onAssigned(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign lead investigator')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--bg-modal, #0d0e17)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px',
        padding: '32px', boxShadow: 'var(--shadow-card)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(56, 189, 248, 0.35)'
          }}>
            <UsersIcon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Assign Lead Investigator
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Case File: <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{caseItem.caseNumber}</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          margin: '16px 0',
          fontSize: '0.85rem'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Incident Title:</div>
          <div style={{ fontWeight: 600, color: '#fff' }}>{caseItem.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Current Assignee:</div>
          <div style={{ color: caseItem.assignedInvestigatorUsername ? 'var(--accent-light)' : '#94a3b8', fontWeight: 600 }}>
            {caseItem.assignedInvestigatorUsername ? `@${caseItem.assignedInvestigatorUsername}` : 'Unassigned'}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            color: '#f87171', fontSize: '0.85rem', marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Select Authorized Officer / Lead *
            </label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="form-input"
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              <option value="">-- Unassigned (No Lead) --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  @{u.username} — {u.role} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-logout"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '10px 22px' }}
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
