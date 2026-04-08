import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { eventsService, participantsService, registrationsService } from '../services/events';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['draft', 'published', 'cancelled', 'completed'];

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEditor } = useAuth();
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const { data: event, loading, error, reload } = useFetch(() => eventsService.getById(id), [id]);
  const { data: eventParticipants, reload: reloadParticipants } = useFetch(() => eventsService.getParticipants(id), [id]);
  const { data: allParticipants } = useFetch(() => participantsService.getAll());
  const { data: allRegistrations, reload: reloadRegistrations } = useFetch(() => registrationsService.getAll());

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    await eventsService.delete(id);
    navigate('/events');
  };

  const handleRegister = async () => {
    if (!selectedParticipant) return;
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');
    try {
      const { data } = await registrationsService.create({ event: id, participant: selectedParticipant });
      setSelectedParticipant('');
      if (data?.status === 'waitlisted') {
        setRegSuccess('Event is at capacity. This participant was added to the waitlist.');
      } else {
        setRegSuccess('Participant registered successfully.');
      }
      reloadParticipants();
      reloadRegistrations();
      reload();
    } catch (err) {
      setRegError(JSON.stringify(err.response?.data || 'Registration failed'));
    } finally {
      setRegLoading(false);
    }
  };

  const registrationEventId = (r) =>
    typeof r.event === 'object' && r.event != null ? r.event.id : (r.event ?? r.event_id);
  const registrationParticipantId = (r) =>
    typeof r.participant === 'object' && r.participant != null ? r.participant.id : (r.participant ?? r.participant_id);

  const handleUnregister = async (participantId) => {
    if (!confirm('Remove this participant from the event?')) return;
    const regs = allRegistrations?.results || allRegistrations || [];
    const reg = regs.find(
      (r) => String(registrationEventId(r)) === String(id) && String(registrationParticipantId(r)) === String(participantId)
    );
    if (!reg) return;
    try {
      await registrationsService.delete(reg.id);
      reloadParticipants();
      reloadRegistrations();
      reload();
    } catch (err) {
      setRegError(JSON.stringify(err.response?.data || 'Unregister failed'));
    }
  };

  const startEditing = () => {
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      status: event.status || 'draft',
      max_participants: event.max_participants ?? '',
    });
    setEditError('');
    setEditing(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await eventsService.update(id, {
        ...editForm,
        max_participants: editForm.max_participants === '' ? null : editForm.max_participants,
      });
      setEditing(false);
      reload();
    } catch (err) {
      setEditError(JSON.stringify(err.response?.data || 'Error updating event'));
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!event) return null;

  const participants = eventParticipants || [];
  const registeredIds = new Set(participants.map((p) => p.id));
  const available = (allParticipants?.results || allParticipants || []).filter((p) => !registeredIds.has(p.id));
  const showRegistrationStatus = participants.some((p) => p.registration_status);
  const statusLabel = (s) =>
    ({ registered: 'Registered', waitlisted: 'Waitlist', cancelled: 'Cancelled' }[s] || s || 'Registered');

  return (
    <div style={{ maxWidth: 800 }}>
      <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: 16, fontSize: 15 }}>
        &larr; Back to Events
      </button>

      {/* Edit Form */}
      {editing ? (
        <div style={{ background: 'white', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, color: '#1e293b' }}>Edit Event</h2>
          {editError && <div style={{ color: '#dc2626', marginBottom: 12 }}>{editError}</div>}
          <form onSubmit={handleEditSave}>
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
                  <input type={type} value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                    required={required}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" disabled={editSaving}
                style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Detail View */
        <div style={{ background: 'white', borderRadius: 10, padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', color: '#1e293b' }}>{event.title}</h1>
              <span style={{
                background: event.status === 'published' ? '#dcfce7' : event.status === 'cancelled' ? '#fef2f2' : '#f1f5f9',
                color: event.status === 'published' ? '#15803d' : event.status === 'cancelled' ? '#dc2626' : '#64748b',
                padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500
              }}>{event.status}</span>
            </div>
            {isEditor && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={startEditing} style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 500 }}>
                  Edit
                </button>
                <button onClick={handleDelete} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Start', value: new Date(event.start_date).toLocaleString() },
              { label: 'End', value: new Date(event.end_date).toLocaleString() },
              { label: 'Location', value: event.location || '\u2014' },
              {
                label: 'Capacity',
                value: event.max_participants
                  ? `${event.participant_count}/${event.max_participants}${
                      event.waitlist_count ? ` (${event.waitlist_count} on waitlist)` : ''
                    }`
                  : `${event.participant_count} registered`,
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
                <div style={{ fontWeight: 500, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
          {event.description && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#374151' }}>Description</div>
              <p style={{ color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{event.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Registered Participants */}
      <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b' }}>Participants ({participants.length})</h2>

        {isEditor && !event.is_full && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <select value={selectedParticipant} onChange={(e) => { setSelectedParticipant(e.target.value); setRegSuccess(''); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}>
              <option value="">Select a participant to register...</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>{p.full_name || `${p.first_name} ${p.last_name}`} ({p.email})</option>
              ))}
            </select>
            <button onClick={handleRegister} disabled={!selectedParticipant || regLoading}
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, opacity: !selectedParticipant ? 0.5 : 1 }}>
              {regLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        )}
        {regSuccess && (
          <p style={{ color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
            {regSuccess}
          </p>
        )}
        {regError && <p style={{ color: '#dc2626' }}>{regError}</p>}

        {participants.length === 0 ? (
          <p style={{ color: '#64748b' }}>No participants yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Name', 'Email', 'Phone', ...(showRegistrationStatus ? ['Status'] : []), ...(isEditor ? ['Actions'] : [])].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px' }}>{p.full_name || `${p.first_name} ${p.last_name}`}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.email}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{p.phone || '\u2014'}</td>
                  {showRegistrationStatus && (
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: p.registration_status === 'waitlisted' ? '#fef3c7' : '#dcfce7',
                        color: p.registration_status === 'waitlisted' ? '#b45309' : '#15803d',
                      }}>
                        {statusLabel(p.registration_status)}
                      </span>
                    </td>
                  )}
                  {isEditor && (
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleUnregister(p.id)}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                        Unregister
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
