import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import CreateCaseModal from '../components/CreateCaseModal'
import UploadEvidenceModal from '../components/UploadEvidenceModal'
import {
  FolderIcon,
  FileCheckIcon,
  ShieldIcon,
  AlertTriangleIcon,
  GitBranchIcon,
  PlusIcon,
  ArrowRightIcon,
  RefreshIcon
} from '../components/Icons'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    totalEvidence: 0,
    verifiedEvidence: 0,
    integrityIssues: 0,
    totalAuditLogs: 0,
    auditChainValid: true,
  })
  const [recentActivity, setRecentActivity] = useState({
    recentEvidence: [],
    recentTransfers: [],
    recentAuditLogs: [],
  })
  const [loading, setLoading] = useState(true)
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity'),
      ])
      setStats(statsRes.data)
      setRecentActivity(activityRes.data)
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Welcome Banner & Quick Action Buttons ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Welcome back, <span className="text-gradient">{user?.username}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Active Security Clearance: <strong style={{ color: 'var(--accent-light)' }}>{user?.role}</strong>.
            All evidence actions are cryptographically signed with SHA-256 hash chaining.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {user?.role !== 'VIEWER' && (
            <>
              <button
                onClick={() => setIsCaseModalOpen(true)}
                className="btn-logout"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderColor: 'rgba(99,102,241,0.4)', color: '#fff',
                  background: 'rgba(99,102,241,0.15)'
                }}
              >
                <PlusIcon className="w-4 h-4" />
                New Case
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
              >
                <FileCheckIcon className="w-4 h-4" />
                Upload Evidence
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Metric Cards Grid (Clickable to jump directly into modules) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Evidence */}
        <div
          onClick={() => navigate('/evidence')}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer',
            transition: 'var(--transition)', backdropFilter: 'var(--blur-sm)'
          }}
          className="stat-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileCheckIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <ArrowRightIcon className="w-4 h-4 text-slate-500" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : stats.totalEvidence}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Evidence Items
          </div>
        </div>

        {/* Total Cases */}
        <div
          onClick={() => navigate('/cases')}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer',
            transition: 'var(--transition)', backdropFilter: 'var(--blur-sm)'
          }}
          className="stat-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderIcon className="w-5 h-5 text-sky-400" />
            </div>
            <ArrowRightIcon className="w-4 h-4 text-slate-500" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : stats.totalCases}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Cases ({stats.activeCases})
          </div>
        </div>

        {/* Verified Evidence */}
        <div
          onClick={() => navigate('/evidence')}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer',
            transition: 'var(--transition)', backdropFilter: 'var(--blur-sm)'
          }}
          className="stat-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>PASS</span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#4ade80' }}>
            {loading ? '...' : stats.verifiedEvidence}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verified Cryptographic Integrity
          </div>
        </div>

        {/* Integrity Issues */}
        <div
          onClick={() => navigate('/evidence')}
          style={{
            background: stats.integrityIssues > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)',
            border: `1px solid ${stats.integrityIssues > 0 ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer',
            transition: 'var(--transition)', backdropFilter: 'var(--blur-sm)'
          }}
          className="stat-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangleIcon className="w-5 h-5 text-red-400" />
            </div>
            {stats.integrityIssues > 0 && <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>ALERT</span>}
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: stats.integrityIssues > 0 ? '#f87171' : '#fff' }}>
            {loading ? '...' : stats.integrityIssues}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Integrity Tamper Warnings
          </div>
        </div>

        {/* Cryptographic Audit Ledger Status */}
        <div
          onClick={() => navigate('/audit-logs')}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px', cursor: 'pointer',
            transition: 'var(--transition)', backdropFilter: 'var(--blur-sm)'
          }}
          className="stat-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GitBranchIcon className="w-5 h-5 text-violet-400" />
            </div>
            <span style={{
              fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px',
              background: stats.auditChainValid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: stats.auditChainValid ? '#4ade80' : '#f87171',
              fontWeight: 700
            }}>
              {stats.auditChainValid ? 'CHAIN VALID' : 'TAMPER DETECTED'}
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : stats.totalAuditLogs}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chained Audit Blocks
          </div>
        </div>
      </div>

      {/* ── Recent Evidence Activity ── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backdropFilter: 'var(--blur-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              Recent Evidence Repository Ingests
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Latest digital files secured with cryptographic SHA-256 signatures
            </p>
          </div>
          <Link to="/evidence" style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            View Full Vault ➔
          </Link>
        </div>

        {recentActivity.recentEvidence.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No evidence files in vault yet. Click "+ Upload Evidence" above to ingest files.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Evidence File</th>
                  <th style={{ padding: '12px 16px' }}>Case Reference</th>
                  <th style={{ padding: '12px 16px' }}>SHA-256 Digest</th>
                  <th style={{ padding: '12px 16px' }}>Uploaded By</th>
                  <th style={{ padding: '12px 16px' }}>Integrity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.recentEvidence.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                      <Link to={`/evidence/${ev.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                        {ev.fileName}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--accent-light)' }}>
                      {ev.caseNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ev.sha256Hash?.substring(0, 16)}...
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
                        className="btn-logout"
                        style={{
                          textDecoration: 'none', color: 'var(--accent-light)',
                          borderColor: 'rgba(99,102,241,0.3)', padding: '4px 10px', fontSize: '0.75rem'
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

      {/* ── Recent Custody Movements & Audit Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Recent Custody Transfers */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Recent Chain-of-Custody Transfers
            </h3>
            <GitBranchIcon className="w-4 h-4 text-violet-400" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.recentTransfers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transfers recorded yet.</div>
            ) : (
              recentActivity.recentTransfers.map(t => (
                <div key={t.id} style={{
                  padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      {t.evidenceFileName}
                    </span>
                    <StatusBadge status={t.action} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    @{t.fromUsername} ➔ @{t.toUsername || 'Locker'} &bull; {t.location}
                  </div>
                  {t.reason && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                      "{t.reason}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Chain Ledger Stream */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                Tamper-Evident Audit Feed
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Linked SHA-256 Hash Chain
              </div>
            </div>
            <Link to="/audit-logs" style={{ color: 'var(--accent-light)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              Verify Ledger ➔
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivity.recentAuditLogs.slice(0, 5).map(a => (
              <div key={a.id} style={{
                padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                    {a.action} by @{a.username}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Hash: {a.currentHash?.substring(0, 16)}...
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <CreateCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onCreated={() => fetchDashboardData()}
      />

      <UploadEvidenceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={() => fetchDashboardData()}
      />
    </div>
  )
}
