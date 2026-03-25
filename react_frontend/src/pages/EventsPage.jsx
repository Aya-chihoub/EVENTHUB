import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { eventsService } from '../services/events';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['', 'draft', 'published', 'cancelled', 'completed'];

export default function EventsPage() {
  const { isEditor } = useAuth();
  const [filters, setFilters] = useState({ status: '', start_date_after: '', start_date_before: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_date: '', end_date: '', status: 'draft', max_participants: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useFetch(
    () => eventsService.getAll(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  const events = data?.results || data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await eventsService.create({ ...form, max_participants: form.max_participants || null });
      setShowForm(false);
      setForm({ title: '', description: '', location: '', start_date: '', end_date: '', status: 'draft', max_participants: '' });
      reload();
    } catch (err) {
      setFormError(JSON.stringify(err.response?.data || 'Error creating event'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#1e293b' }}>Events</h1>
        {isEditor && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: '#3b82f6', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600
          }}>
            + New Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 10, padding: '1rem 1.5rem', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Status</label>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>From</label>
          <input type="date" value={filters.start_date_after}
            onChange={e => setFilters({ ...filters, start_date_after: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>To</label>
          <input type="date" value={filters.start_date_before}
            onChange={e => setFilters({ ...filters, start_date_before: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <button onClick={() => setFilters({ status: '', start_date_after: '', start_date_before: '' })}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>
          Reset
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Create New Event</h3>
          {formError && <div style={{ color: '#dc2626', marginBottom: 12 }}>{formError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { key: 'title', label: 'Title', type: 'text', required: true },
                { key: 'location', label: 'Location', type: 'text' },
                { key: 'start_date', label: 'Start Date', type: 'datetime-local', required: true },
                { key: 'end_date', label: 'End Date', type: 'datetime-local', required: true },
                { key: 'max_participants', label: 'Max Participants', type: 'number' },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required={required}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                  {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" disabled={saving}
                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading && <p style={{ color: '#64748b' }}>Loading events...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {!loading && events.length === 0 && <p style={{ color: '#64748b' }}>No events found.</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {events.map(event => (
          <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.15s' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 16 }}>{event.title}</div>
                <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
                  📅 {new Date(event.start_date).toLocaleDateString()} · 📍 {event.location || 'No location'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>👥 {event.participant_count}</span>
                <span style={{
                  background: event.status === 'published' ? '#dcfce7' : event.status === 'cancelled' ? '#fef2f2' : '#f1f5f9',
                  color: event.status === 'published' ? '#15803d' : event.status === 'cancelled' ? '#dc2626' : '#64748b',
                  padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500
                }}>{event.status}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
