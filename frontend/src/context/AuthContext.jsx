import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ─── Storage Keys ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'evitrace_token'
const USER_KEY  = 'evitrace_user'

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Persist token & user ──────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const saveSession = (response) => {
    setToken(response.token)
    setUser({
      userId:   response.userId,
      username: response.username,
      email:    response.email,
      role:     response.role,
    })
  }

  const extractErrorMsg = (err) => {
    if (err?.response?.data?.message) return err.response.data.message
    if (err?.response?.data?.error)   return err.response.data.error
    return err?.message || 'An unexpected error occurred'
  }

  // ── Auth Actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      saveSession(data)
      return { success: true }
    } catch (err) {
      const msg = extractErrorMsg(err)
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, email, password, role) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/register', { username, email, password, role })
      saveSession(data)
      return { success: true }
    } catch (err) {
      const msg = extractErrorMsg(err)
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // ── Computed ──────────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(token && user)
  const isAdmin         = user?.role === 'ADMIN'
  const isInvestigator  = user?.role === 'INVESTIGATOR'

  const value = {
    user, token, loading, error,
    isAuthenticated, isAdmin, isInvestigator,
    login, register, logout, clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
