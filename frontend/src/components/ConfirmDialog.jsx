// src/components/ConfirmDialog.jsx
import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true, confirmLabel = 'Delete', loading = false }) {
  const cancelRef = useRef(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc"
         onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 id="confirm-title" style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
            {danger && <span style={{ color: 'var(--color-error)', fontSize: '1.2em' }}>⚠</span>}
            {title}
          </h2>
        </div>
        <div className="modal-body">
          <p id="confirm-desc" style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--leading-loose)' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button ref={cancelRef} className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
