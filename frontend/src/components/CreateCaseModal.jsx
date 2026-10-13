import React, { useState, useEffect } from 'react'
import api from '../api/axios'

export default function CreateCaseModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [investigatorId, setInvestigatorId] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      api.get('/users').then(res => setUsers(res.data)).catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assignedInvestigatorId: investigatorId ? Number(investigatorId) : null,
      }
      const res = await api.post('/cases', payload)
      onCreated && onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create case')
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
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px',
        padding: '32px', boxShadow: 'var(--shadow-card)', position: 'relative'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
          Open New Investigation Case
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          Initialize an official case file. An immutable unique Case ID will be generated.
        </p>

        {error && (
          <div style={{
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            color: '#f87171', fontSize: '0.85rem', marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Case Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operation Cybershield: Malware Intrusion"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Description & Scope
            </label>
            <textarea
              rows={3}
              placeholder="Brief details regarding suspected incident, targets, and investigation scope..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Assign Lead Investigator / Officer
            </label>
            <select
              value={investigatorId}
              onChange={e => setInvestigatorId(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            >
              <option value="">-- Unassigned (Assign Later) --</option>
              {users.filter(u => u.role === 'INVESTIGATOR' || u.role === 'ADMIN').length > 0 && (
                <optgroup label="Investigating Officers & Authorities">
                  {users
                    .filter(u => u.role === 'INVESTIGATOR' || u.role === 'ADMIN')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        Officer {u.username} ({u.role}) — {u.email}
                      </option>
                    ))}
                </optgroup>
              )}
              {users.filter(u => u.role !== 'INVESTIGATOR' && u.role !== 'ADMIN').length > 0 && (
                <optgroup label="Other Personnel">
                  {users
                    .filter(u => u.role !== 'INVESTIGATOR' && u.role !== 'ADMIN')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role}) — {u.email}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
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
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Creating...' : 'Create Case File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
