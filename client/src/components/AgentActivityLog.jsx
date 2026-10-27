import React from 'react';
import {
  Check,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

/**
 * AgentActivityLog Component
 * 
 * Visually communicates agentic execution states:
 * - Pending
 * - Running
 * - Completed
 * - Warning
 * - Replanning
 * - Failed
 * 
 * Strictly displays observable tool/action events (zero internal reasoning or secrets).
 */
export default function AgentActivityLog({
  loading = false,
  activeStageIndex = -1,
  stages = [],
  executionLog = [],
  missingInfo = [],
  warningMessage = '',
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <Check style={{ width: 14, height: 14 }} />,
          className: 'step-completed',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Completed',
        };
      case 'replanning':
        return {
          icon: <RotateCcw style={{ width: 14, height: 14 }} />,
          className: 'step-replanning',
          color: '#818cf8',
          bg: 'rgba(99, 102, 241, 0.18)',
          border: 'rgba(99, 102, 241, 0.35)',
          label: 'Re-planning',
        };
      case 'warning':
        return {
          icon: <AlertTriangle style={{ width: 14, height: 14 }} />,
          className: 'step-warning',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          label: 'Warning',
        };
      case 'failed':
        return {
          icon: <XCircle style={{ width: 14, height: 14 }} />,
          className: 'step-failed',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          label: 'Failed',
        };
      case 'running':
        return {
          icon: <RefreshCw className="spin-icon" style={{ width: 14, height: 14 }} />,
          className: 'step-running',
          color: 'var(--primary)',
          bg: 'rgba(69, 87, 153, 0.18)',
          border: 'rgba(69, 87, 153, 0.4)',
          label: 'Running',
        };
      case 'pending':
      default:
        return {
          icon: <span>•</span>,
          className: 'step-pending',
          color: 'var(--text-dimmed)',
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'var(--border-glass)',
          label: 'Pending',
        };
    }
  };

  return (
    <div className="ai-section">
      <div className="ai-section-title">
        <Sliders style={{ width: 20, height: 20, color: 'var(--primary-500)' }} />
        <span>AGENT ACTIVITY LOG</span>
        {loading && (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span className="pulse-dot" /> Autonomous Agent Active
          </span>
        )}
      </div>

      <div className="glass-card activity-stream-card">
        {/* Subtitle / Explanation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Observable Tool & Planning Events
          </span>
          <span style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles style={{ width: 12, height: 12 }} /> Deterministic Coordination
          </span>
        </div>

        <div className="activity-stepper">
          {/* Progressive Stepper while running */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stages.map((stage, idx) => {
                const isDone = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;
                const badge = getStatusBadge(isDone ? 'completed' : isCurrent ? 'running' : 'pending');

                return (
                  <div key={stage.id} className="activity-step-item">
                    <div
                      className="activity-step-icon"
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                          color: isCurrent ? 'var(--text-primary)' : isDone ? '#10b981' : 'var(--text-dimmed)',
                          fontSize: '0.95rem',
                        }}
                      >
                        {stage.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: badge.color,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {isCurrent ? 'In Progress' : isDone ? 'Done' : 'Queued'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Real Observable Execution Log Steps */}
          {!loading && executionLog.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {executionLog.map((log, idx) => {
                const badge = getStatusBadge(log.status);

                return (
                  <div key={idx} className="activity-step-item">
                    <div
                      className="activity-step-icon"
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
                      <span
                        style={{
                          fontWeight: log.status === 'warning' ? 700 : 600,
                          color: log.status === 'warning' ? '#f59e0b' : log.status === 'replanning' ? '#818cf8' : 'var(--text-primary)',
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                        }}
                      >
                        {log.message}
                      </span>
                      {log.timestamp && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dimmed)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning / Needs Input Notice */}
        {missingInfo.length > 0 && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
            }}
          >
            <AlertTriangle style={{ width: 22, height: 22, color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.25rem' }}>
                Additional Parameters Required
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {warningMessage || 'The agent requires more specific information to formulate a plan:'}
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: '#f59e0b', margin: 0 }}>
                {missingInfo.map((info, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>
                    <strong>{info}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
