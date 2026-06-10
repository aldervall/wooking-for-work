import React from 'react';

export function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '1rem', color: 'var(--c-text-muted)'
    }}>
      <div style={{
        width: '40px', height: '40px', border: '3px solid var(--c-border)',
        borderTop: '3px solid var(--c-accent)', borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading Wooking for Work...</p>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export function ErrorView({ error, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '1.5rem', padding: '2rem'
    }}>
      <div style={{ fontSize: '48px', color: 'var(--c-red)' }}>⚠</div>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '20px', fontWeight: 600, color: 'var(--c-text)' }}>
          Something went wrong
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--c-text-muted)', fontFamily: 'var(--f-mono)' }}>
          {error}
        </p>
      </div>
      {onRetry && (
        <button className="btn primary" onClick={onRetry}
          style={{ padding: '0.5rem 1.5rem', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Try Again
        </button>
      )}
    </div>
  );
}
