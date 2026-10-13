import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import TransferCustodyModal from '../components/TransferCustodyModal'
import ProvenanceGraph from '../components/ProvenanceGraph'
import {
  FileCheckIcon,
  ShieldIcon,
  GitBranchIcon,
  HistoryIcon,
  DownloadIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  PlusIcon
} from '../components/Icons'

export default function EvidenceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [evidence, setEvidence] = useState(null)
  const [custodyChain, setCustodyChain] = useState([])
  const [provenanceData, setProvenanceData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [integrityHistory, setIntegrityHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('custody') // custody, provenance, timeline, integrity
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)

  const fetchEvidenceDetails = async () => {
    try {
      const [evRes, custodyRes, provRes, timelineRes, integrityRes] = await Promise.all([
        api.get(`/evidence/${id}`),
        api.get(`/evidence/${id}/custody`),
        api.get(`/evidence/${id}/provenance`),
        api.get(`/evidence/${id}/timeline`),
        api.get(`/evidence/${id}/integrity`),
      ])
      setEvidence(evRes.data)
      setCustodyChain(custodyRes.data)
      setProvenanceData(provRes.data)
      setTimeline(timelineRes.data)
      setIntegrityHistory(integrityRes.data)
    } catch (err) {
      console.error('Failed to load evidence item', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidenceDetails()
  }, [id])

  const handleVerifyIntegrity = async () => {
    setVerifying(true)
    try {
      const res = await api.post(`/evidence/${id}/verify`)
      setVerificationResult(res.data)
      fetchEvidenceDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get(`/evidence/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', evidence.fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to download evidence file')
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading evidence record...</div>
  }

  if (!evidence) {
    return <div style={{ padding: 40, color: '#f87171', textAlign: 'center' }}>Evidence record not found.</div>
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
        <Link to="/evidence" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>Evidence Vault</Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{evidence.fileName}</span>
      </div>

      {/* ── Evidence Header & Verification Status ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px', backdropFilter: 'var(--blur-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <StatusBadge status={evidence.lastIntegrityStatus || evidence.status} />
              <Link to={`/cases/${evidence.caseId}`} style={{ fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>
                Case: {evidence.caseNumber} ({evidence.caseTitle})
              </Link>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              {evidence.fileName}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '720px' }}>
              {evidence.description || 'No descriptive notes recorded during ingest.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload}
              className="btn-logout"
              style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: 'var(--border)', color: '#fff' }}
            >
              <DownloadIcon className="w-4 h-4" />
              Download File
            </button>

            {user?.role !== 'VIEWER' && (
              <button
                onClick={handleVerifyIntegrity}
                disabled={verifying}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                }}
              >
                <ShieldIcon className="w-4 h-4" />
                {verifying ? 'Recomputing SHA-256...' : 'Verify Integrity Now'}
              </button>
            )}
          </div>
        </div>

        {/* ── Verification Result Alert Banner ── */}
        {verificationResult && (
          <div style={{
            marginTop: 24, padding: '20px', borderRadius: 'var(--radius)',
            background: verificationResult.matched ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${verificationResult.matched ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.5)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 16
          }}>
            {verificationResult.matched ? (
              <CheckCircleIcon className="w-6 h-6 text-emerald-400" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertTriangleIcon className="w-6 h-6 text-red-400" style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: verificationResult.matched ? '#4ade80' : '#f87171' }}>
                {verificationResult.matched
                  ? 'Cryptographic SHA-256 Integrity Verified'
                  : 'Integrity verification failed. The current file hash does not match the stored hash.'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f1f5f9', marginTop: 4 }}>
                {verificationResult.notes}
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: '0.75rem', fontFamily: 'monospace', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Stored Baseline: </span>
                  <span style={{ color: '#fff' }}>{verificationResult.expectedHash}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Disk Checksum: </span>
                  <span style={{ color: verificationResult.matched ? '#4ade80' : '#f87171' }}>
                    {verificationResult.actualHash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Technical Metadata Grid ── */}
        <div style={{
          marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              SHA-256 Cryptographic Fingerprint
            </div>
            <div
              title="Click to copy full hash"
              onClick={() => {
                navigator.clipboard.writeText(evidence.sha256Hash)
                alert('Copied SHA-256 to clipboard:\n' + evidence.sha256Hash)
              }}
              style={{
                fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-light)',
                wordBreak: 'break-all', cursor: 'pointer', background: 'rgba(255,255,255,0.03)',
                padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)'
              }}
            >
              {evidence.sha256Hash}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              MIME Type & Storage Size
            </div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              {evidence.fileType} &bull; {(evidence.fileSize / 1024).toFixed(1)} KB ({evidence.fileSize} bytes)
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Ingested By Officer
            </div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              @{evidence.uploadedByUsername}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(evidence.uploadedDate).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>
              Physical Storage Vault Path
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
              {evidence.storagePath}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12
      }}>
        <button
          onClick={() => setActiveTab('custody')}
          style={{
            background: activeTab === 'custody' ? 'rgba(99,102,241,0.18)' : 'transparent',
            border: `1px solid ${activeTab === 'custody' ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
            color: activeTab === 'custody' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <GitBranchIcon className="w-4 h-4 text-violet-400" />
          Chain of Custody ({custodyChain.length})
        </button>

        <button
          onClick={() => setActiveTab('provenance')}
          style={{
            background: activeTab === 'provenance' ? 'rgba(99,102,241,0.18)' : 'transparent',
            border: `1px solid ${activeTab === 'provenance' ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
            color: activeTab === 'provenance' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <ShieldIcon className="w-4 h-4 text-sky-400" />
          Evidence Provenance Graph
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            background: activeTab === 'timeline' ? 'rgba(99,102,241,0.18)' : 'transparent',
            border: `1px solid ${activeTab === 'timeline' ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
            color: activeTab === 'timeline' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <HistoryIcon className="w-4 h-4 text-indigo-400" />
          Chronological Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('integrity')}
          style={{
            background: activeTab === 'integrity' ? 'rgba(99,102,241,0.18)' : 'transparent',
            border: `1px solid ${activeTab === 'integrity' ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
            color: activeTab === 'integrity' ? '#fff' : 'var(--text-secondary)',
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          Integrity Check History ({integrityHistory.length})
        </button>
      </div>

      {/* ── Tab Contents ── */}
      {/* 1. Chain of Custody */}
      {activeTab === 'custody' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px', backdropFilter: 'var(--blur-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Complete Chain-of-Custody Record
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Mandatory legal transfer ledger tracing every movement, custodian handover, and analysis phase.
              </p>
            </div>

            {user?.role !== 'VIEWER' && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '8px 16px' }}
              >
                <PlusIcon className="w-4 h-4" />
                Transfer Custody
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Transferred From</th>
                  <th style={{ padding: '12px 16px' }}>Transferred To</th>
                  <th style={{ padding: '12px 16px' }}>Storage Location</th>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Justification / Reason</th>
                </tr>
              </thead>
              <tbody>
                {custodyChain.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={t.action} />
                    </td>
                    <td style={{ padding: '16px', color: '#fff', fontWeight: 600 }}>
                      @{t.fromUsername}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--accent-light)', fontWeight: 600 }}>
                      {t.toUsername ? `@${t.toUsername}` : <span style={{ color: 'var(--text-muted)' }}>Evidence Vault</span>}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {t.location}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', maxWidth: 260 }}>
                      {t.reason || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Provenance Graph */}
      {activeTab === 'provenance' && (
        <ProvenanceGraph graphData={provenanceData} />
      )}

      {/* 3. Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px', backdropFilter: 'var(--blur-sm)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>
            Evidence Lifecycle Chronology
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', paddingLeft: 20 }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute', left: 29, top: 10, bottom: 10, width: 2,
              background: 'linear-gradient(180deg, var(--accent) 0%, rgba(139,92,246,0.2) 100%)'
            }} />

            {timeline.map((evt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                {/* Node Bullet */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: evt.eventType === 'INTEGRITY_CHECK' ? '#22c55e' : 'var(--accent)',
                  border: '3px solid #05050a', zIndex: 2, flexShrink: 0, marginTop: 4,
                  boxShadow: '0 0 10px rgba(99,102,241,0.5)'
                }} />

                {/* Event Card */}
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      {evt.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {evt.description}
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                    <span>Actor: <strong style={{ color: '#fff' }}>@{evt.actor}</strong></span>
                    {evt.status && <span>Status: <strong style={{ color: 'var(--accent-light)' }}>{evt.status}</strong></span>}
                    {evt.hashOrMeta && (
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {evt.hashOrMeta.length > 24 ? evt.hashOrMeta.substring(0, 24) + '...' : evt.hashOrMeta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Integrity Check History */}
      {activeTab === 'integrity' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px', backdropFilter: 'var(--blur-sm)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 20 }}>
            SHA-256 Verification Audit Trail
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Verification Date</th>
                  <th style={{ padding: '12px 16px' }}>Verified By</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Computed Checksum</th>
                  <th style={{ padding: '12px 16px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {integrityHistory.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px', color: '#fff' }}>
                      {new Date(c.checkDate).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--accent-light)', fontWeight: 600 }}>
                      @{c.checkedByUsername}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {c.actualHash?.substring(0, 20)}...
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)', maxWidth: 300 }}>
                      {c.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Custody Modal */}
      <TransferCustodyModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        evidenceId={evidence.id}
        evidenceName={evidence.fileName}
        onTransferred={() => fetchEvidenceDetails()}
      />
    </div>
  )
}
