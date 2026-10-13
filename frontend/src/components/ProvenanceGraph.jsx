import React, { useState } from 'react'
import StatusBadge from './StatusBadge'
import { FolderIcon, FileCheckIcon, GitBranchIcon, CheckCircleIcon } from './Icons'

export default function ProvenanceGraph({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null)

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No provenance graph data available yet.
      </div>
    )
  }

  const { nodes, edges } = graphData

  const getNodeIcon = (type) => {
    switch (type) {
      case 'CASE':
        return <FolderIcon className="w-5 h-5 text-sky-400" />
      case 'EVIDENCE':
        return <FileCheckIcon className="w-5 h-5 text-indigo-400" />
      case 'TRANSFER':
        return <GitBranchIcon className="w-5 h-5 text-violet-400" />
      case 'CHECK':
        return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
      default:
        return <FileCheckIcon className="w-5 h-5 text-slate-400" />
    }
  }

  const getNodeColor = (type) => {
    switch (type) {
      case 'CASE':
        return { bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.4)' }
      case 'EVIDENCE':
        return { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.5)' }
      case 'TRANSFER':
        return { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.4)' }
      case 'CHECK':
        return { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.4)' }
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'var(--border)' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: 'rgba(10, 12, 22, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        backdropFilter: 'var(--blur-sm)',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Interactive Provenance Flow</strong>: Traces evidence origin, judicial transfers, and verification links.
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
            <span style={{ color: '#38bdf8' }}>● Case</span>
            <span style={{ color: '#818cf8' }}>● Evidence Item</span>
            <span style={{ color: '#a78bfa' }}>● Custody Handover</span>
            <span style={{ color: '#34d399' }}>● Verification</span>
          </div>
        </div>

        {/* Node Flow Visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 0', minWidth: '700px' }}>
          {nodes.map((node, index) => {
            const colors = getNodeColor(node.type)
            const isSelected = selectedNode?.id === node.id

            return (
              <React.Fragment key={node.id}>
                {/* Visual Node */}
                <div
                  onClick={() => setSelectedNode(node)}
                  style={{
                    background: colors.bg,
                    border: `1px solid ${isSelected ? '#fff' : colors.border}`,
                    borderRadius: 'var(--radius)',
                    padding: '16px 20px',
                    width: '240px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'var(--transition)',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getNodeIcon(node.type)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                        {node.type}
                      </span>
                    </div>
                    {node.status && <StatusBadge status={node.status} />}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.label}
                  </div>

                  {node.subtitle && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.subtitle}
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {node.timestamp ? new Date(node.timestamp).toLocaleString() : 'N/A'}
                  </div>
                </div>

                {/* Flow Connector Arrow */}
                {index < nodes.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)', marginBottom: 4 }}>
                      {edges[index]?.label || 'RELATION'}
                    </div>
                    <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.8))' }} />
                    <span style={{ fontSize: '1rem', color: 'var(--accent-light)', marginTop: -7 }}>➔</span>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div style={{
          background: 'rgba(15, 17, 30, 0.9)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-light)', textTransform: 'uppercase', fontWeight: 600 }}>
              Inspecting Node: {selectedNode.type}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {selectedNode.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {selectedNode.subtitle}
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="btn-logout"
            style={{ color: 'var(--text-muted)' }}
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  )
}
