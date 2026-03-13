// src/pages/DirectoryPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import { api } from '../utils/api';
import ContactFormModal from '../components/ContactFormModal';
import ContactViewModal from '../components/ContactViewModal';
import ConfirmDialog from '../components/ConfirmDialog';

const PAGE_SIZE = 12;

function SortIcon({ field, sort, order }) {
  if (sort !== field) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
  return <span style={{ marginLeft: '4px', color: 'var(--color-primary)' }}>{order === 'asc' ? '↑' : '↓'}</span>;
}

function ContactCard({ contact, onView, onEdit, onDelete, canEdit }) {
  const initials = contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="contact-card" onClick={() => onView(contact)} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(contact); }}
         aria-label={`View ${contact.name}`}>
      <div className="contact-card-top">
        <div className="contact-avatar">{initials}</div>
        {canEdit && (
          <div className="contact-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(contact)} aria-label={`Edit ${contact.name}`}
              title="Edit" style={{ minWidth: 0, padding: '5px 8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(contact)} aria-label={`Delete ${contact.name}`}
              title="Delete" style={{ minWidth: 0, padding: '5px 8px', color: 'var(--color-error)', borderColor: 'transparent' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <h3 className="contact-name">{contact.name}</h3>
      <p className="contact-title">{contact.title}</p>
      {contact.department && <span className="badge badge-viewer contact-dept">{contact.department}</span>}
      <div className="contact-details">
        {contact.email && (
          <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="contact-detail" title={contact.email}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>{contact.email}</span>
          </a>
        )}
        {contact.mobile && (
          <a href={`tel:${contact.mobile}`} onClick={(e) => e.stopPropagation()} className="contact-detail">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>{contact.mobile}</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [contacts, setContacts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort]           = useState('name');
  const [order, setOrder]         = useState('asc');
  const [viewMode, setViewMode]   = useState('card'); // 'card' | 'table'

  // Modals
  const [viewContact, setViewContact]     = useState(null);
  const [editContact, setEditContact]     = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.contacts.list({ search, page, limit: PAGE_SIZE, sort, order });
      setContacts(result.data);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page, sort, order]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field) => {
    if (sort === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  const handleSave = async (fields) => {
    if (editContact?.id) {
      const updated = await api.contacts.update(editContact.id, fields);
      setContacts(cs => cs.map(c => c.id === updated.id ? updated : c));
      addToast(`${updated.name} updated successfully.`, 'success');
    } else {
      const created = await api.contacts.create(fields);
      addToast(`${created.name} added to directory.`, 'success');
      setPage(1); setSearch(''); setSearchInput('');
      await fetchContacts();
    }
    setEditContact(null); setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteContact) return;
    setDeleting(true);
    try {
      await api.contacts.delete(deleteContact.id);
      addToast(`${deleteContact.name} removed from directory.`, 'success');
      setDeleteContact(null);
      await fetchContacts();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (contact) => { setEditContact(contact); setShowForm(true); };
  const openAdd  = () => { setEditContact(null); setShowForm(true); };

  return (
    <main>
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <div className="dir-header-row">
            <div>
              <h1>Staff Directory</h1>
              <p>{total.toLocaleString()} {total === 1 ? 'contact' : 'contacts'} in directory</p>
            </div>
            {isAdmin && (
              <button className="btn btn-lg dir-add-btn" onClick={openAdd}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Contact
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dir-toolbar">
        <div className="container dir-toolbar-inner">
          {/* Search */}
          <div className="dir-search-wrap">
            <svg className="dir-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              className="dir-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, title, email, or department…"
              aria-label="Search contacts"
            />
            {searchInput && (
              <button className="dir-search-clear" onClick={() => { setSearchInput(''); setSearch(''); }} aria-label="Clear search">✕</button>
            )}
          </div>

          {/* View toggle */}
          <div className="dir-view-toggle" role="group" aria-label="View mode">
            <button className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('card')} aria-pressed={viewMode === 'card'} title="Card view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Cards
            </button>
            <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} title="Table view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container dir-content">
        {loading && (
          <div className="dir-loading" aria-live="polite" aria-busy="true">
            <div className="dir-spinner" />
            <span>Loading contacts…</span>
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="dir-empty">
            <div className="dir-empty-icon" aria-hidden="true">📋</div>
            <h2>{search ? 'No contacts match your search' : 'No contacts yet'}</h2>
            <p>{search ? `Try a different search term.` : isAdmin ? 'Get started by adding the first contact.' : 'Contacts will appear here once added by an admin.'}</p>
            {!search && isAdmin && <button className="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }} onClick={openAdd}>Add First Contact</button>}
          </div>
        )}

        {!loading && contacts.length > 0 && viewMode === 'card' && (
          <div className="contacts-grid">
            {contacts.map(c => (
              <ContactCard key={c.id} contact={c} canEdit={isAdmin}
                onView={setViewContact} onEdit={openEdit} onDelete={setDeleteContact} />
            ))}
          </div>
        )}

        {!loading && contacts.length > 0 && viewMode === 'table' && (
          <div className="card" style={{ marginTop: 'var(--sp-6)' }}>
            <div className="table-wrap">
              <table aria-label="Contact directory">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} aria-sort={sort==='name' ? order : 'none'}>
                      Name <SortIcon field="name" sort={sort} order={order} />
                    </th>
                    <th onClick={() => handleSort('title')} aria-sort={sort==='title' ? order : 'none'}>
                      Title <SortIcon field="title" sort={sort} order={order} />
                    </th>
                    <th onClick={() => handleSort('department')} aria-sort={sort==='department' ? order : 'none'}>
                      Dept <SortIcon field="department" sort={sort} order={order} />
                    </th>
                    <th onClick={() => handleSort('email')} aria-sort={sort==='email' ? order : 'none'}>
                      Email <SortIcon field="email" sort={sort} order={order} />
                    </th>
                    <th>Mobile</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id}>
                      <td>
                        <button className="table-name-btn" onClick={() => setViewContact(c)}>
                          <div className="table-avatar">{c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
                          <strong>{c.name}</strong>
                        </button>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{c.title}</td>
                      <td>{c.department ? <span className="badge badge-viewer">{c.department}</span> : <span style={{color:'var(--color-text-light)'}}>—</span>}</td>
                      <td><a href={`mailto:${c.email}`} style={{ color: 'var(--color-primary)' }}>{c.email}</a></td>
                      <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{c.mobile || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewContact(c)}>View</button>
                          {isAdmin && <>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                            <button className="btn btn-sm" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', background: 'transparent' }}
                              onClick={() => setDeleteContact(c)}>Delete</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span>Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, total)} of {total}</span>
              <div className="pagination-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(1)} disabled={page === 1} aria-label="First page">«</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p-1)} disabled={page === 1} aria-label="Previous page">‹</button>
                <span style={{ padding: '0 var(--sp-3)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {page} / {pages}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p+1)} disabled={page >= pages} aria-label="Next page">›</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(pages)} disabled={page >= pages} aria-label="Last page">»</button>
              </div>
            </div>
          </div>
        )}

        {/* Card view pagination */}
        {!loading && contacts.length > 0 && viewMode === 'card' && pages > 1 && (
          <div className="pagination" style={{ background: 'transparent', border: 'none', marginTop: 'var(--sp-4)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Page {page} of {pages} · {total} contacts
            </span>
            <div className="pagination-btns">
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p-1)} disabled={page === 1}>‹ Prev</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p+1)} disabled={page >= pages}>Next ›</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(pages)} disabled={page >= pages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {viewContact && (
        <ContactViewModal
          contact={viewContact}
          canEdit={isAdmin}
          onClose={() => setViewContact(null)}
          onEdit={(c) => { setViewContact(null); openEdit(c); }}
        />
      )}

      {showForm && (
        <ContactFormModal
          contact={editContact}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditContact(null); }}
        />
      )}

      {deleteContact && (
        <ConfirmDialog
          title="Delete Contact"
          message={`Are you sure you want to permanently remove ${deleteContact.name} from the directory? This action cannot be undone.`}
          confirmLabel="Delete Contact"
          onConfirm={handleDelete}
          onCancel={() => setDeleteContact(null)}
          loading={deleting}
        />
      )}

      <style>{`
        .dir-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--sp-6);
          flex-wrap: wrap;
        }
        .dir-add-btn {
          background: #fff;
          color: var(--color-primary);
          border-color: #fff;
          flex-shrink: 0;
        }
        .dir-add-btn:hover:not(:disabled) { background: rgba(255,255,255,0.88); box-shadow: none; }

        .dir-toolbar {
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          padding: var(--sp-4) 0;
          position: sticky;
          top: var(--nav-height);
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }
        .dir-toolbar-inner {
          display: flex;
          align-items: center;
          gap: var(--sp-4);
          flex-wrap: wrap;
        }
        .dir-search-wrap {
          flex: 1;
          min-width: 240px;
          position: relative;
        }
        .dir-search-icon {
          position: absolute;
          left: var(--sp-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .dir-search {
          width: 100%;
          padding: var(--sp-2) var(--sp-4) var(--sp-2) calc(var(--sp-3)*2 + 16px);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: var(--text-base);
          transition: border-color var(--transition), box-shadow var(--transition);
          min-height: 44px;
        }
        .dir-search:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(150,27,30,0.10);
        }
        .dir-search-clear {
          position: absolute;
          right: var(--sp-3);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: var(--text-base);
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 50%;
        }
        .dir-search-clear:hover { background: var(--color-surface-2); }

        .dir-view-toggle { display: flex; gap: var(--sp-2); flex-shrink: 0; }

        .dir-content { padding-top: var(--sp-8); padding-bottom: var(--sp-16); }

        .dir-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--sp-4); padding: var(--sp-16);
          color: var(--color-text-muted); font-family: var(--font-heading);
        }
        .dir-spinner {
          width: 40px; height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dir-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: var(--sp-16) var(--sp-6);
          text-align: center;
          gap: var(--sp-3);
        }
        .dir-empty-icon { font-size: 3rem; }
        .dir-empty h2 { font-family: var(--font-heading); font-size: var(--text-lg); color: var(--color-secondary); }
        .dir-empty p  { color: var(--color-text-muted); max-width: 380px; }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--sp-5);
          margin-top: var(--sp-6);
        }

        .contact-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--sp-5);
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          cursor: pointer;
          position: relative;
        }
        .contact-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary);
        }
        .contact-card:focus-visible {
          outline: 3px solid var(--color-primary);
          outline-offset: 2px;
        }
        .contact-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--sp-4);
        }
        .contact-avatar {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: var(--color-primary-ghost);
          border: 2px solid rgba(150,27,30,0.15);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading);
          font-weight: var(--weight-bold);
          font-size: var(--text-base);
          color: var(--color-primary);
          flex-shrink: 0;
        }
        .contact-actions {
          display: flex;
          gap: var(--sp-1);
          opacity: 0;
          transition: opacity var(--transition);
        }
        .contact-card:hover .contact-actions,
        .contact-card:focus-within .contact-actions { opacity: 1; }

        .contact-name {
          font-family: var(--font-heading);
          font-size: var(--text-base);
          font-weight: var(--weight-bold);
          color: var(--color-text);
          margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .contact-title {
          font-size: var(--text-sm);
          color: var(--color-secondary);
          margin-bottom: var(--sp-2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .contact-dept { margin-bottom: var(--sp-3); }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
          margin-top: var(--sp-3);
          border-top: 1px solid var(--color-border);
          padding-top: var(--sp-3);
        }
        .contact-detail {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--text-xs);
          color: var(--color-primary);
          text-decoration: none;
          overflow: hidden;
        }
        .contact-detail span {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .contact-detail:hover { text-decoration: underline; }

        .table-name-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: var(--sp-3);
          font-size: inherit; text-align: left; color: var(--color-text);
          padding: 0;
        }
        .table-name-btn:hover strong { color: var(--color-primary); }
        .table-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--color-primary-ghost);
          border: 1px solid rgba(150,27,30,0.15);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading);
          font-weight: var(--weight-bold);
          font-size: var(--text-xs);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .contacts-grid { grid-template-columns: 1fr; }
          .dir-toolbar-inner { flex-direction: column; align-items: stretch; }
          .dir-view-toggle { justify-content: flex-end; }
        }
      `}</style>
    </main>
  );
}
