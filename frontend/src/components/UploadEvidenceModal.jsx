import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { UploadIcon, ShieldIcon, FileCheckIcon } from './Icons'

export default function UploadEvidenceModal({ isOpen, onClose, initialCaseId, onUploaded }) {
  const [cases, setCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || '')
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [clientHash, setClientHash] = useState('')
  const [calculatingHash, setCalculatingHash] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      api.get('/cases').then(res => setCases(res.data)).catch(console.error)
      if (initialCaseId) setSelectedCaseId(initialCaseId)
    } else {
      setFile(null)
      setDescription('')
      setClientHash('')
      setError(null)
    }
  }, [isOpen, initialCaseId])

  if (!isOpen) return null

  // Compute SHA-256 client-side using Web Crypto API
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return
    setFile(selectedFile)
    setCalculatingHash(true)
    setClientHash('')

    try {
      const buffer = await selectedFile.arrayBuffer()
      const digestBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(digestBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setClientHash(hashHex)
    } catch (err) {
      console.warn('Browser crypto calculation fallback', err)
    } finally {
      setCalculatingHash(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !selectedCaseId) {
      setError('Please select both a case and a file to upload.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('caseId', selectedCaseId)
      formData.append('file', file)
      if (description) formData.append('description', description.trim())

      const res = await api.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      onUploaded && onUploaded(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload evidence.')
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--bg-modal, #0d0e17)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '580px',
        padding: '32px', boxShadow: 'var(--shadow-card)', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UploadIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Secure Evidence Intake
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              SHA-256 Cryptographic Ingest & Chain-of-Custody Inception
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
              Target Case *
            </label>
            <select
              required
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            >
              <option value="">-- Select Case --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Select Digital Evidence File *
            </label>
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <input
                id="file-upload-input"
                type="file"
                style={{ display: 'none' }}
                onChange={e => handleFileChange(e.target.files[0])}
              />
              <FileCheckIcon className="w-8 h-8" style={{ margin: '0 auto 10px', color: 'var(--accent-light)' }} />
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                {file ? file.name : 'Click to select or drag and drop evidence file'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {file ? formatBytes(file.size) : 'Images, Videos, Logs, PDF, Forensics Dumps (Up to 500MB)'}
              </div>
            </div>
          </div>

          {/* Real-time calculated SHA-256 preview */}
          {(calculatingHash || clientHash) && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                <ShieldIcon className="w-4 h-4" />
                <span>Pre-Ingest SHA-256 Fingerprint:</span>
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: '0.75rem', color: '#f1f5f9',
                marginTop: 4, wordBreak: 'break-all'
              }}>
                {calculatingHash ? 'Computing cryptographic digest...' : clientHash}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Chain-of-Custody Ingest Notes / Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Memory dump acquired from workstation WS-09, seized during warrant execution."
              value={description}
              onChange={e => setDescription(e.target.value)}
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
              disabled={uploading || !file || calculatingHash}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              {uploading ? 'Ingesting Evidence...' : 'Ingest & Sign SHA-256'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
