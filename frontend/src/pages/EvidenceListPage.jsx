import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import UploadEvidenceModal from '../components/UploadEvidenceModal'
import {
  FileCheckIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  DownloadIcon,
  AlertTriangleIcon
} from '../components/Icons'

export default function EvidenceListPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [evidence, setEvidence] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [caseFilter, setCaseFilter] = useState(searchParams.get('caseId') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [verifyingId, setVerifyingId] = useState(null)
  const [quickVerifyResult, setQuickVerifyResult] = useState(null)

  const fetchEvidence = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchQuery.trim()) params.query = searchQuery.trim()
      if (caseFilter) params.caseId = caseFilter
      if (statusFilter) params.status = statusFilter

      const [evRes, casesRes] = await Promise.all([
        api.get('/evidence', { params }),
        api.get('/cases'),
      ])
      setEvidence(evRes.data)
      setCases(casesRes.data)
    } catch (err) {
      console.error('Failed to load evidence', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()
  }, [caseFilter, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchEvidence()
  }

  const handleQuickVerify = async (evId) => {
    setVerifyingId(evId)
    setQuickVerifyResult(null)
    try {
      const res = await api.post(`/evidence/${evId}/verify`)
      setQuickVerifyResult(res.data)
      fetchEvidence()
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCheckIcon className="w-6 h-6 text-indigo-400" />
            Digital Evidence Vault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Catalog of all cryptographic evidence items, SHA-256 fingerprints, and integrity states.
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <PlusIcon className="w-4 h-4" />
            Upload Evidence File
          </button>
        )}
      </div>

      {/* ── Quick Verification Banner Notice ── */}
      {quickVerifyResult && (
        <div style={{
          background: quickVerifyResult.matched ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)',
          border: `1px solid ${quickVerifyResult.matched ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.5)'}`,
          borderRadius: 'var(--radius)', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {quickVerifyResult.matched ? (
              <ShieldIcon className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangleIcon className="w-6 h-6 text-red-400" />
            )}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                {quickVerifyResult.matched
                  ? `Integrity Verified: ${quickVerifyResult.evidenceFileName}`
                  : `WARNING: Integrity Mismatch on ${quickVerifyResult.evidenceFileName}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {quickVerifyResult.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setQuickVerifyResult(null)}
            className="btn-logout"
            style={{ color: 'var(--text-muted)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Search and Filter Controls ── */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search file name, description, SHA-256..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon className="w-4 h-4" />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Filter
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={caseFilter}
            onChange={e => setCaseFilter(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Cases</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="STORED">Stored</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="ARCHIVED">Archived</option>
            <option value="TAMPERED">Tampered / Mismatch</option>
          </select>
        </div>
      </div>

      {/* ── Evidence Table ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Accessing evidence vault...
          </div>
        ) : evidence.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No evidence items found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Evidence File</th>
                  <th style={{ padding: '12px 16px' }}>Associated Case</th>
                  <th style={{ padding: '12px 16px' }}>Size & Type</th>
                  <th style={{ padding: '12px 16px' }}>Cryptographic SHA-256</th>
                  <th style={{ padding: '12px 16px' }}>Ingested By</th>
                  <th style={{ padding: '12px 16px' }}>Integrity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map(ev => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px' }}>
                      <Link to={`/evidence/${ev.id}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                        {ev.fileName}
                      </Link>
                      {ev.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {ev.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Link to={`/cases/${ev.caseId}`} style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>
                        {ev.caseNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {(ev.fileSize / 1024).toFixed(1)} KB &bull; <span style={{ color: 'var(--text-muted)' }}>{ev.fileType}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div
                        title="Click to copy full SHA-256"
                        onClick={() => {
                          navigator.clipboard.writeText(ev.sha256Hash)
                          alert('Copied SHA-256 to clipboard:\n' + ev.sha256Hash)
                        }}
                        style={{
                          fontFamily: 'monospace', fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.04)', padding: '4px 8px',
                          borderRadius: 6, border: '1px solid var(--border)',
                          cursor: 'pointer', display: 'inline-block', color: 'var(--text-secondary)'
                        }}
                      >
                        {ev.sha256Hash?.substring(0, 16)}...
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      @{ev.uploadedByUsername}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(ev.uploadedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={ev.lastIntegrityStatus || ev.status} />
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {user?.role !== 'VIEWER' && (
                          <button
                            onClick={() => handleQuickVerify(ev.id)}
                            disabled={verifyingId === ev.id}
                            className="btn-logout"
                            style={{
                              padding: '6px 10px', fontSize: '0.75rem',
                              borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80'
                            }}
                            title="Verify physical file hash against stored fingerprint"
                          >
                            {verifyingId === ev.id ? 'Checking...' : 'Verify Hash'}
                          </button>
                        )}
                        <Link
                          to={`/evidence/${ev.id}`}
                          className="btn-primary"
                          style={{
                            textDecoration: 'none', padding: '6px 12px', fontSize: '0.75rem'
                          }}
                        >
                          Details & Timeline
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadEvidenceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => fetchEvidence()}
      />
    </div>
  )
}
