// src/components/ContactViewModal.jsx
import { useEffect } from 'react';

function DetailRow({ icon, label, value, href }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-icon" aria-hidden="true">{icon}</span>
      <div className="detail-content">
        <span className="detail-label">{label}</span>
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="detail-value detail-link">{value}</a>
          : <span className="detail-value">{value}</span>}
      </div>
    </div>
  );
}

export default function ContactViewModal({ contact, onClose, onEdit, canEdit }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const initials = contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-title"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        {/* Header strip */}
        <div className="view-header">
          <div className="view-avatar">{initials}</div>
          <div className="view-meta">
            <h2 id="view-title">{contact.name}</h2>
            <p className="view-title-text">{contact.title}</p>
            {contact.department && <span className="badge badge-viewer" style={{ marginTop: '4px' }}>{contact.department}</span>}
          </div>
          <button className="btn btn-ghost btn-sm view-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Details */}
        <div className="modal-body view-body">
          <DetailRow icon="✉" label="Email" value={contact.email} href={`mailto:${contact.email}`} />
          <DetailRow icon="📱" label="Mobile" value={contact.mobile} href={`tel:${contact.mobile}`} />
          <DetailRow icon="☎" label="Telephone" value={contact.telephone} href={`tel:${contact.telephone}`} />
          <DetailRow icon="📠" label="Fax" value={contact.fax} />
          <DetailRow icon="📍" label="Office Address" value={contact.office_address} />
          <DetailRow icon="🔗" label="Website" value={contact.website} href={contact.website} />
          {contact.updated_at && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-light)', marginTop: 'var(--sp-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-3)' }}>
              Last updated {new Date(contact.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {canEdit && <button className="btn btn-primary" onClick={() => { onClose(); onEdit(contact); }}>Edit Contact</button>}
        </div>
      </div>

      <style>{`
        .view-header {
          background: var(--color-primary);
          padding: var(--sp-6);
          display: flex;
          align-items: flex-start;
          gap: var(--sp-4);
          position: relative;
        }
        .view-avatar {
          flex-shrink: 0;
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading);
          font-weight: var(--weight-bold);
          font-size: var(--text-lg);
          color: #fff;
        }
        .view-meta { flex: 1; min-width: 0; }
        .view-meta h2 {
          font-family: var(--font-heading);
          font-size: var(--text-md);
          color: #fff;
          margin: 0;
        }
        .view-title-text { color: rgba(255,255,255,0.78); font-size: var(--text-sm); margin-top: 2px; }
        .view-close {
          position: absolute; top: var(--sp-4); right: var(--sp-4);
          color: rgba(255,255,255,0.7);
          border-color: rgba(255,255,255,0.25);
          min-width: 0; padding: 6px 10px;
        }
        .view-close:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
        .view-body { display: flex; flex-direction: column; gap: var(--sp-3); }
        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: var(--sp-3);
          padding: var(--sp-2) 0;
        }
        .detail-icon { font-size: var(--text-base); flex-shrink: 0; width: 24px; text-align: center; margin-top: 2px; }
        .detail-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .detail-label { font-family: var(--font-heading); font-size: var(--text-xs); font-weight: var(--weight-bold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-secondary); }
        .detail-value { font-size: var(--text-base); color: var(--color-text); word-break: break-word; }
        .detail-link { color: var(--color-primary); }
        .detail-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
