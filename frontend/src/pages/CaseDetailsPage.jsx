import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import UploadEvidenceModal from '../components/UploadEvidenceModal'
import AssignInvestigatorModal from '../components/AssignInvestigatorModal'
import {
  FolderIcon,
  FileCheckIcon,
  PlusIcon,
  ArrowRightIcon,
  UsersIcon,
  ShieldIcon
} from '../components/Icons'

export default function CaseDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [caseData, setCaseData] = useState(null)
  const [evidenceList, setEvidenceList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [assigning, setAssigning] = useState(false)

  const fetchCaseDetails = async () => {
    try {
      const [caseRes, evidenceRes, usersRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/evidence?caseId=${id}`),
        api.get('/users'),
      ])
      setCaseData(caseRes.data)
      setEvidenceList(evidenceRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.error('Failed to load case details', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaseDetails()
  }, [id])

  const handleCloseCase = async () => {
    if (!window.confirm('Are you sure you want to officially close this case?')) return
    try {
      await api.post(`/cases/${id}/close`)
      fetchCaseDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close case')
    }
  }

  const handleAssignInvestigator = async (investigatorId) => {
    if (!investigatorId) return
    setAssigning(true)
    try {
      await api.post(`/cases/${id}/assign`, { investigatorId: Number(investigatorId) })
      fetchCaseDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign investigator')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading case file...</div>
  }

  if (!caseData) {
    return <div style={{ padding: 40, color: '#f87171', textAlign: 'center' }}>Case file not found.</div>
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Breadcrumb & Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
        <Link to="/cases" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>Cases</Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{caseData.caseNumber}</span>
      </div>

      {/* ── Case Header Banner ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px', backdropFilter: 'var(--blur-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                {caseData.caseNumber}
              </span>
              <StatusBadge status={caseData.status} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              {caseData.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '720px', lineHeight: 1.6 }}>
              {caseData.description || 'No description provided.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {user?.role !== 'VIEWER' && (
              <>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Attach Evidence
                </button>
                {caseData.status !== 'CLOSED' && (
                  <button
                    onClick={handleCloseCase}
                    className="btn-logout"
                    style={{ borderColor: 'rgba(239,68,68,0.4)' }}
                  >
                    Close Case File
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Lead Investigator
            </div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              {caseData.assignedInvestigatorUsername ? `@${caseData.assignedInvestigatorUsername}` : 'Unassigned'}
            </div>
            {user?.role === 'ADMIN' && (
              <select
                disabled={assigning}
                onChange={e => handleAssignInvestigator(e.target.value)}
                className="form-input"
                style={{ marginTop: 6, fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, width: 'auto' }}
                defaultValue=""
              >
                <option value="" disabled>Change Lead Officer...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'INVESTIGATOR' || u.role === 'ADMIN' ? `Officer ${u.username} (${u.role})` : `${u.username} (${u.role})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Case Created By
            </div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              @{caseData.createdByUsername}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Date Opened
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {new Date(caseData.createdAt).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Evidence Manifest
            </div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              📁 {evidenceList.length} items logged
            </div>
          </div>
        </div>
      </div>

      {/* ── Attached Evidence Repository ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px', backdropFilter: 'var(--blur-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Attached Digital Evidence Manifest
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Files secured in this case with immutable SHA-256 fingerprint verification
            </p>
          </div>

          {user?.role !== 'VIEWER' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-logout"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                borderColor: 'rgba(99,102,241,0.3)', color: 'var(--accent-light)', fontSize: '0.8rem'
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Upload to Case
            </button>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No evidence files attached to this case yet. Click "Attach Evidence" above to ingest files.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Filename</th>
                  <th style={{ padding: '12px 16px' }}>Type & Size</th>
                  <th style={{ padding: '12px 16px' }}>SHA-256 Digest</th>
                  <th style={{ padding: '12px 16px' }}>Ingested By</th>
                  <th style={{ padding: '12px 16px' }}>Integrity Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.map(ev => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                      <Link to={`/evidence/${ev.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                        {ev.fileName}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {ev.fileType} &bull; {(ev.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ev.sha256Hash?.substring(0, 18)}...
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      @{ev.uploadedByUsername}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={ev.lastIntegrityStatus || ev.status} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link
                        to={`/evidence/${ev.id}`}
                        className="btn-primary"
                        style={{
                          textDecoration: 'none', padding: '6px 14px', fontSize: '0.75rem'
                        }}
                      >
                        Inspect & Verify
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal with case pre-selected */}
      <UploadEvidenceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialCaseId={id}
        onUploaded={() => fetchCaseDetails()}
      />
    </div>
  )
}
