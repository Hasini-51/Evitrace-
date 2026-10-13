import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import CreateCaseModal from '../components/CreateCaseModal'
import { FolderIcon, PlusIcon, SearchIcon } from '../components/Icons'

export default function CasesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCases = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchQuery.trim()) params.query = searchQuery.trim()
      if (statusFilter) params.status = statusFilter

      const res = await api.get('/cases', { params })
      setCases(res.data)
    } catch (err) {
      console.error('Failed to load cases', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchCases()
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderIcon className="w-6 h-6 text-sky-400" />
            Case Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Manage investigations, assign investigators, and correlate digital evidence files.
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <PlusIcon className="w-4 h-4" />
            New Investigation Case
          </button>
        )}
      </div>

      {/* ── Search and Filter Controls ── */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search case number, incident title..."
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
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* ── Cases Table / Grid ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', backdropFilter: 'var(--blur-sm)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading cases...
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No cases match your search criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Case Number</th>
                  <th style={{ padding: '12px 16px' }}>Title & Description</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Lead Investigator</th>
                  <th style={{ padding: '12px 16px' }}>Evidence Count</th>
                  <th style={{ padding: '12px 16px' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--accent-light)', whiteSpace: 'nowrap' }}>
                      <Link to={`/cases/${c.id}`} style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
                        {c.caseNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '16px', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description || 'No description provided.'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {c.assignedInvestigatorUsername ? `@${c.assignedInvestigatorUsername}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#fff' }}>
                      📁 {c.evidenceCount} files
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Link
                        to={`/cases/${c.id}`}
                        className="btn-logout"
                        style={{
                          textDecoration: 'none', color: '#fff',
                          borderColor: 'var(--border)', padding: '6px 14px', fontSize: '0.8rem'
                        }}
                      >
                        Open Case File
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchCases()}
      />
    </div>
  )
}
