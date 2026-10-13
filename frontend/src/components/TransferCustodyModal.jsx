import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { GitBranchIcon } from './Icons'

export default function TransferCustodyModal({ isOpen, onClose, evidenceId, evidenceName, onTransferred }) {
  const [users, setUsers] = useState([])
  const [toUserId, setToUserId] = useState('')
  const [action, setAction] = useState('TRANSFERRED')
  const [reason, setReason] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      api.get('/users').then(res => setUsers(res.data)).catch(console.error)
      setReason('')
      setLocation('Digital Evidence Vault')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        toUserId: toUserId ? Number(toUserId) : null,
        action: action,
        reason: reason.trim() || 'Standard investigation custody handover',
        location: location.trim() || 'Central Vault',
      }

      const res = await api.post(`/evidence/${evidenceId}/transfer`, payload)
      onTransferred && onTransferred(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record custody transfer')
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
        padding: '32px', boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.4)'
          }}>
            <GitBranchIcon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Transfer Chain of Custody
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: <span style={{ color: 'var(--accent-light)' }}>{evidenceName}</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            color: '#f87171', fontSize: '0.85rem', margin: '16px 0'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Custody Action *
            </label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            >
              <option value="TRANSFERRED">TRANSFERRED (Handover to Custodian/Investigator)</option>
              <option value="CHECKED_OUT">CHECKED_OUT (Taken for Forensic Analysis/Court)</option>
              <option value="RETURNED">RETURNED (Returned to Secure Vault)</option>
              <option value="ANALYZED">ANALYZED (Bench Testing Completed)</option>
              <option value="DISPOSED">DISPOSED (Legal Disposition)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Transfer To (Recipient User)
            </label>
            <select
              value={toUserId}
              onChange={e => setToUserId(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            >
              <option value="">-- Evidence Locker / Unassigned Custodian --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  @{u.username} — ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Secure Storage Location / Facility *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cyber Crime Lab #2 Locker 4B"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Legal Justification / Reason *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Submitted for SHA-256 integrity re-examination and forensic memory parsing."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
            />
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
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Recording Transfer...' : 'Sign Custody Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
