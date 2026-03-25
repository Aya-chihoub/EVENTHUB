import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { participantsService } from '../services/events';
import { useAuth } from '../context/AuthContext';

export default function ParticipantsPage() {
  const { isEditor } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const { data, loading, error, reload } = useFetch(() => participantsService.getAll());
  const participants = data?.results || data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await participantsService.create(form);
      setShowForm(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', bio: '' });
      reload();
    } catch (err) {
      setFormError(JSON.stringify(err.response?.data || 'Error creating participant'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this participant?')) return;
    await participantsService.delete(id);
    reload();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone || '',
      bio: p.bio || '',
    });
    setEditError('');
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await participantsService.update(editingId, editForm);
      setEditingId(null);
      setEditForm(null);
      reload();
    } catch (err) {
      setEditError(JSON.stringify(err.response?.data || 'Error updating participant'));
    } finally {
      setEditSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#1e293b' }}>Participants</h1>
        {isEditor && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: '#8b5cf6', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600
          }}>
            + New Participant
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Add Participant</h3>
          {formError && <div style={{ color: '#dc2626', marginBottom: 12 }}>{formError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { key: 'first_name', label: 'First Name', required: true },
                { key: 'last_name', label: 'Last Name', required: true },
                { key: 'email', label: 'Email', type: 'email', required: true },
                { key: 'phone', label: 'Phone' },
              ].map(({ key, label, type = 'text', required }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required={required}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" disabled={saving}
                style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p>Loading participants...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {!loading && participants.length === 0 && <p style={{ color: '#64748b' }}>No participants yet.</p>}

      {editError && <p style={{ color: '#dc2626', marginBottom: 12 }}>{editError}</p>}

      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Name', 'Email', 'Phone', ...(isEditor ? ['Actions'] : [])].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              editingId === p.id ? (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <td style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                        placeholder="First" style={{ width: '45%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }} />
                      <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                        placeholder="Last" style={{ width: '45%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }} />
                    </div>
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      type="email" style={{ width: '90%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: '90%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={handleEditSave} disabled={editSaving}
                        style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                        {editSaving ? '...' : 'Save'}
                      </button>
                      <button onClick={cancelEdit}
                        style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.full_name || `${p.first_name} ${p.last_name}`}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.email}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.phone || '\u2014'}</td>
                  {isEditor && (
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(p)}
                          style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
