// src/components/ContactFormModal.jsx
import { useState, useEffect, useRef } from 'react';

const EMPTY = {
  name: '', title: '', email: '', mobile: '', telephone: '',
  fax: '', office_address: '', website: '', department: ''
};

const DEPARTMENTS = [
  '', 'Executive', 'Technology', 'Finance', 'Human Resources',
  'Marketing', 'Operations', 'Legal', 'Sales', 'Other'
];

function validate(fields) {
  const errs = {};
  if (!fields.name.trim())  errs.name  = 'Name is required';
  if (!fields.title.trim()) errs.title = 'Title / Position is required';
  if (!fields.email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errs.email = 'Enter a valid email address';
  }
  const phoneRe = /^[\d\s\+\-\(\)\.]*$/;
  if (fields.mobile    && !phoneRe.test(fields.mobile))    errs.mobile    = 'Invalid phone number';
  if (fields.telephone && !phoneRe.test(fields.telephone)) errs.telephone = 'Invalid phone number';
  if (fields.fax       && !phoneRe.test(fields.fax))       errs.fax       = 'Invalid fax number';
  if (fields.website) {
    try { new URL(fields.website); }
    catch { errs.website = 'Enter a valid URL (e.g. https://example.com)'; }
  }
  return errs;
}

export default function ContactFormModal({ contact, onSave, onClose }) {
  const isEdit = Boolean(contact?.id);
  const [fields, setFields] = useState(isEdit ? { ...EMPTY, ...contact } : EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (field) => (e) => {
    setFields(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(fields);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ id, label, required, hint, error, children }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}{required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint  && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error" role="alert">⚠ {error}</span>}
    </div>
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 id="modal-title">{isEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog" style={{ minWidth: 0, padding: '6px 10px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors._global && (
              <div className="form-error" role="alert" style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'rgba(192,57,43,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-error)' }}>
                ⚠ {errors._global}
              </div>
            )}

            <div className="form-grid">
              {/* Row 1 */}
              <Field id="f-name" label="Full Name" required error={errors.name}>
                <input ref={firstRef} id="f-name" className={`form-input ${errors.name ? 'error' : ''}`}
                  type="text" value={fields.name} onChange={set('name')}
                  autoComplete="name" maxLength={120} placeholder="e.g. Maria Santos" />
              </Field>

              <Field id="f-title" label="Title / Position" required error={errors.title}>
                <input id="f-title" className={`form-input ${errors.title ? 'error' : ''}`}
                  type="text" value={fields.title} onChange={set('title')}
                  maxLength={120} placeholder="e.g. Chief Executive Officer" />
              </Field>

              {/* Row 2 */}
              <Field id="f-email" label="Email Address" required error={errors.email}>
                <input id="f-email" className={`form-input ${errors.email ? 'error' : ''}`}
                  type="email" value={fields.email} onChange={set('email')}
                  autoComplete="email" maxLength={254} placeholder="name@company.com" />
              </Field>

              <Field id="f-dept" label="Department" error={errors.department}>
                <select id="f-dept" className="form-select" value={fields.department} onChange={set('department')}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d || '— Select department —'}</option>)}
                </select>
              </Field>

              {/* Row 3 */}
              <Field id="f-mobile" label="Mobile Number" error={errors.mobile} hint="Include country code, e.g. +63 917 123 4567">
                <input id="f-mobile" className={`form-input ${errors.mobile ? 'error' : ''}`}
                  type="tel" value={fields.mobile} onChange={set('mobile')}
                  autoComplete="tel" maxLength={30} placeholder="+63 917 000 0000" />
              </Field>

              <Field id="f-telephone" label="Telephone Number" error={errors.telephone}>
                <input id="f-telephone" className={`form-input ${errors.telephone ? 'error' : ''}`}
                  type="tel" value={fields.telephone} onChange={set('telephone')}
                  autoComplete="tel" maxLength={30} placeholder="+63 2 8000 0000" />
              </Field>

              {/* Row 4 */}
              <Field id="f-fax" label="Fax Number" error={errors.fax}>
                <input id="f-fax" className={`form-input ${errors.fax ? 'error' : ''}`}
                  type="tel" value={fields.fax} onChange={set('fax')}
                  maxLength={30} placeholder="+63 2 8000 0001" />
              </Field>

              <Field id="f-website" label="Website Link" error={errors.website} hint="Must include https://">
                <input id="f-website" className={`form-input ${errors.website ? 'error' : ''}`}
                  type="url" value={fields.website} onChange={set('website')}
                  maxLength={512} placeholder="https://company.com/team/name" />
              </Field>

              {/* Full width */}
              <Field id="f-address" label="Office Address" error={errors.office_address} style={{ gridColumn: '1 / -1' }}>
                <input id="f-address" className="form-input"
                  type="text" value={fields.office_address} onChange={set('office_address')}
                  maxLength={300} placeholder="Floor, Building, Street, City, ZIP" />
              </Field>
            </div>

            <p style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-light)' }}>
              <span style={{ color: 'var(--color-primary)' }}>*</span> Required fields
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner" aria-hidden="true" />Saving…</>
                : isEdit ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-5);
        }
        .form-grid .form-group:last-child { grid-column: 1 / -1; }
        @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: var(--sp-2);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
