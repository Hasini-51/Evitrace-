import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import {
  HistoryIcon,
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon
} from '../components/Icons'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit-logs')
      setLogs(res.data)
    } catch (err) {
      console.error('Failed to load audit ledger', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const handleVerifyChain = async () => {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await api.get('/audit-logs/verify')
      setVerifyResult(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Audit chain verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <HistoryIcon className="w-6 h-6 text-violet-400" />
            Tamper-Evident Audit Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Cryptographically chained SHA-256 blocks ensuring complete non-repudiation and tamper detection.
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          }}
        >
          <ShieldIcon className="w-4 h-4" />
          {verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Audit Chain'}
        </button>
      </div>

      {/* ── Verification Result Report Banner ── */}
      {verifyResult && (
        <div style={{
          background: verifyResult.valid ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.18)',
          border: `1px solid ${verifyResult.valid ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.6)'}`,
          borderRadius: 'var(--radius)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {verifyResult.valid ? (
              <CheckCircleIcon className="w-7 h-7 text-emerald-400" />
            ) : (
              <AlertTriangleIcon className="w-7 h-7 text-red-400" />
            )}
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: verifyResult.valid ? '#4ade80' : '#f87171' }}>
                {verifyResult.valid ? 'Audit Chain Authenticity Confirmed' : 'TAMPER WARNING: Broken Audit Chain'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>
                {verifyResult.message}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16, marginTop: 8, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.75rem', fontFamily: 'monospace'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Verified Blocks: </span>
              <strong style={{ color: '#fff' }}>{verifyResult.totalRecords}</strong>
            </div>
            {verifyResult.latestHash && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Latest Merkle Hash: </span>
                <span style={{ color: 'var(--accent-light)' }}>{verifyResult.latestHash.substring(0, 24)}...</span>
              </div>
            )}
            {verifyResult.genesisHash && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Genesis Root: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{verifyResult.genesisHash.substring(0, 16)}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hash Chained Ledger Table ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Inspecting cryptographic blocks...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No audit records found in chain.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Block #</th>
                  <th style={{ padding: '12px 14px' }}>Timestamp</th>
                  <th style={{ padding: '12px 14px' }}>Actor</th>
                  <th style={{ padding: '12px 14px' }}>Operation</th>
                  <th style={{ padding: '12px 14px' }}>Entity</th>
                  <th style={{ padding: '12px 14px' }}>Details</th>
                  <th style={{ padding: '12px 14px' }}>Previous Hash</th>
                  <th style={{ padding: '12px 14px' }}>Block Hash</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                      #{l.id}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontWeight: 600 }}>
                      @{l.username}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        fontSize: '0.7rem', padding: '3px 8px', borderRadius: 4,
                        background: 'rgba(99,102,241,0.15)', color: 'var(--accent-light)',
                        fontWeight: 700, fontFamily: 'monospace'
                      }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                      {l.entityType} {l.entityId ? `#${l.entityId}` : ''}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)', maxWidth: 260 }}>
                      {l.details}
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {l.previousHash?.substring(0, 10)}...
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
                      {l.currentHash?.substring(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
