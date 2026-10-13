import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

/* ── Icons ─────────────────────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ── Role definitions ──────────────────────────────────────────────────── */
const ROLES = [
  { key: 'ADMIN',        icon: '🛡️', label: 'Admin',        desc: 'Full access' },
  { key: 'INVESTIGATOR', icon: '🔍', label: 'Investigator', desc: 'Upload & verify' },
  { key: 'VIEWER',       icon: '👁️', label: 'Viewer',       desc: 'Read only' },
]

/* ── Password strength ─────────────────────────────────────────────────── */
function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)           score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  const map = [
    { label: '',       color: '' },
    { label: 'Weak',   color: '#ef4444' },
    { label: 'Fair',   color: '#f59e0b' },
    { label: 'Good',   color: '#22c55e' },
    { label: 'Strong', color: '#6366f1' },
  ]
  return { score, ...map[score] }
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', role: 'INVESTIGATOR',
  })
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError]   = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const strength = passwordStrength(form.password)

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }))
    if (formError) setFormError('')
  }

  const setRole = (key) => {
    setForm(prev => ({ ...prev, role: key }))
  }

  const validate = () => {
    const errors = {}
    if (!form.username.trim())  errors.username = 'Username is required'
    else if (form.username.trim().length < 3) errors.username = 'Min 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errors.username = 'Letters, numbers, underscores only'

    if (!form.email.trim())     errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address'

    if (!form.password)         errors.password = 'Password is required'
    else if (form.password.length < 6) errors.password = 'Minimum 6 characters'

    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    const result = await register(form.username.trim(), form.email.trim(), form.password, form.role)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setFormError(result.error)
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card" style={{ maxWidth: 500 }}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon"><ShieldIcon /></div>
          <div className="auth-brand-text">
            <h1>EviTrace</h1>
            <span>Chain of Custody Platform</span>
          </div>
        </div>

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-sub">Join EviTrace to manage digital evidence securely</p>

        {/* Error alert */}
        {formError && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertIcon />
            <span>{formError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <div className="form-input-wrap">
              <span className="form-input-icon"><UserIcon /></span>
              <input
                id="reg-username"
                type="text"
                name="username"
                className="form-input"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
            {fieldErrors.username && (
              <span className="field-error"><AlertIcon /> {fieldErrors.username}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="form-input-wrap">
              <span className="form-input-icon"><MailIcon /></span>
              <input
                id="reg-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error"><AlertIcon /> {fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="form-input-wrap">
              <span className="form-input-icon"><LockIcon /></span>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
              <button type="button" className="password-toggle"
                onClick={() => setShowPass(p => !p)}
                aria-label="Toggle password visibility">
                <EyeIcon open={showPass} />
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{
                  height: 3, borderRadius: 2,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength.score / 4) * 100}%`,
                    background: strength.color,
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                  {strength.label}
                </span>
              </div>
            )}
            {fieldErrors.password && (
              <span className="field-error"><AlertIcon /> {fieldErrors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="form-input-wrap">
              <span className="form-input-icon"><LockIcon /></span>
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
              <button type="button" className="password-toggle"
                onClick={() => setShowConfirm(p => !p)}
                aria-label="Toggle confirm password visibility">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {/* Match indicator */}
            {form.confirmPassword && form.password && (
              <span style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: form.password === form.confirmPassword ? 'var(--success)' : 'var(--error)',
              }}>
                {form.password === form.confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </span>
            )}
            {fieldErrors.confirmPassword && (
              <span className="field-error"><AlertIcon /> {fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="role-badges">
              {ROLES.map(r => (
                <div
                  key={r.key}
                  className={`role-badge ${form.role === r.key ? 'active' : ''}`}
                  onClick={() => setRole(r.key)}
                  role="radio"
                  aria-checked={form.role === r.key}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setRole(r.key)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span style={{ fontWeight: 700 }}>{r.label}</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
                    {r.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            <span className="btn-content">
              {loading ? (
                <><span className="spinner" /> Creating account…</>
              ) : (
                'Create Account'
              )}
            </span>
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
