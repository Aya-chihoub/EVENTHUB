import { useFetch } from '../hooks/useFetch';
import { eventsService, participantsService, registrationsService } from '../services/events';

const StatCard = ({ label, value, color }) => (
  <div style={{
    background: 'white', borderRadius: 10, padding: '1.5rem', flex: 1,
    borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: 36, fontWeight: 700, color }}>{value ?? '—'}</div>
    <div style={{ color: '#64748b', marginTop: 4 }}>{label}</div>
  </div>
);

export default function DashboardPage() {
  const { data: events } = useFetch(() => eventsService.getAll());
  const { data: participants } = useFetch(() => participantsService.getAll());
  const { data: registrations } = useFetch(() => registrationsService.getAll());

  const eventsArr = events?.results || events || [];
  const participantsArr = participants?.results || participants || [];
  const registrationsArr = registrations?.results || registrations || [];

  const upcoming = eventsArr.filter(e => e.status === 'published').length;

  return (
    <div>
      <h1 style={{ marginTop: 0, color: '#1e293b' }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Total Events" value={eventsArr.length} color="#3b82f6" />
        <StatCard label="Published Events" value={upcoming} color="#10b981" />
        <StatCard label="Participants" value={participantsArr.length} color="#8b5cf6" />
        <StatCard label="Registrations" value={registrationsArr.length} color="#f59e0b" />
      </div>

      <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b' }}>Recent Events</h2>
        {eventsArr.length === 0 ? (
          <p style={{ color: '#64748b' }}>No events yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Title', 'Date', 'Status', 'Participants'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventsArr.slice(0, 5).map(event => (
                <tr key={event.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px' }}>{event.title}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                    {new Date(event.start_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      background: event.status === 'published' ? '#dcfce7' : '#f1f5f9',
                      color: event.status === 'published' ? '#15803d' : '#64748b',
                      padding: '2px 10px', borderRadius: 20, fontSize: 13
                    }}>{event.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{event.participant_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
