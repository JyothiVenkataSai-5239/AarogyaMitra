import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getSocket } from '../services/socket';
import { apiFetch, parseJson } from '../services/api';
import Toast from '../components/Toast';
import QueueDashboard from '../components/QueueDashboard';

const AdminDashboard = ({ user, token, onLogout }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [walkInData, setWalkInData] = useState({
    patientName: '',
    ageGroup: '',
    disease: '',
    visitType: 'Consultation'
  });

  const ageGroups = ['Child (0-12)', 'Teen (13-17)', 'Adult (18-40)', 'Middle-aged (41-60)', 'Senior (60+)'];
  const diseases = ['Fever', 'Diabetes', 'Heart Disease', 'Cancer', 'Fracture', 'Neurological Disorder', 'Kidney Disease', 'Eye Problem', 'Dental Issue', 'General Checkup', 'Other'];
  const visitTypes = ['Emergency', 'Consultation', 'Follow-up', 'Routine Checkup'];

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await parseJson(response);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error fetching appointments: ' + err.message);
      setToastType('error');
      setToastMessage('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleQueueUpdated = () => {
      fetchAppointments();
      setToastType('info');
      setToastMessage('Queue updated');
    };

    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayApts = appointments.filter((apt) => new Date(apt.createdAt).toDateString() === today);

    return {
      totalToday: todayApts.length,
      pending: appointments.filter((apt) => apt.status === 'Pending').length,
      completed: appointments.filter((apt) => apt.status === 'Completed').length,
      cancelled: appointments.filter((apt) => apt.status === 'Cancelled').length,
      walkIns: appointments.filter((apt) => apt.bookingSource === 'walk-in').length
    };
  }, [appointments]);

  const handleLogout = () => {
    onLogout?.();
    navigate('/login');
  };

  const changeView = (viewId) => {
    setActiveView(viewId);
    setMenuOpen(false);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await apiFetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setToastType('success');
        setToastMessage('Appointment updated');
        await fetchAppointments();
      } else {
        setError('Failed to update appointment');
        setToastType('error');
        setToastMessage('Failed to update appointment');
      }
    } catch (err) {
      setError('Error updating appointment: ' + err.message);
      setToastType('error');
      setToastMessage('Error updating appointment');
    }
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!walkInData.ageGroup || !walkInData.disease || !walkInData.visitType) {
      setError('Please fill all walk-in fields');
      return;
    }

    try {
      const response = await apiFetch('/api/admin/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(walkInData)
      });

      const data = await parseJson(response);
      if (!response.ok) {
        setError(data.message || 'Failed to add walk-in appointment');
        setToastType('error');
        setToastMessage(data.message || 'Failed to add walk-in appointment');
        return;
      }

      setWalkInData({
        patientName: '',
        ageGroup: '',
        disease: '',
        visitType: 'Consultation'
      });
      setToastType('success');
      setToastMessage('Walk-in added to queue');
      setActiveView('queue');
      await fetchAppointments();
    } catch (err) {
      setError('Error adding walk-in appointment: ' + err.message);
      setToastType('error');
      setToastMessage('Error adding walk-in appointment');
    }
  };

  const renderHospitalSelector = () => null;

  const renderStats = () => (
    <div className="admin-stats-grid">
      <div className="admin-stat-card">
        <span>{stats.totalToday}</span>
        <p>Today</p>
      </div>
      <div className="admin-stat-card warning">
        <span>{stats.pending}</span>
        <p>Pending</p>
      </div>
      <div className="admin-stat-card success">
        <span>{stats.completed}</span>
        <p>Completed</p>
      </div>
      <div className="admin-stat-card danger">
        <span>{stats.cancelled}</span>
        <p>Cancelled</p>
      </div>
      <div className="admin-stat-card">
        <span>{stats.walkIns}</span>
        <p>Walk-ins</p>
      </div>
    </div>
  );

  const renderAppointmentsTable = () => (
    <section className="section-card admin-main-card">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Appointments</p>
          <h2>Manage Appointments</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={fetchAppointments}>Refresh</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p className="empty-state">No appointments found for this hospital scope.</p>
      ) : (
        <div className="table-responsive">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Hospital</th>
                <th>Source</th>
                <th>Disease</th>
                <th>Visit</th>
                <th>Doctor</th>
                <th>Queue</th>
                <th>Wait</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id}>
                  <td><strong>{apt.userId?.name || 'Walk-in'}</strong></td>
                  <td>{apt.hospitalId?.name}</td>
                  <td>{apt.bookingSource || 'online'}</td>
                  <td>{apt.disease}</td>
                  <td>{apt.visitType}</td>
                  <td>{apt.doctorType}</td>
                  <td><span className="queue-number">#{apt.queueNumber}</span></td>
                  <td>{apt.predictedWaitTime ?? apt.expectedTime} min</td>
                  <td><span className={`status-badge status-${apt.status}`}>{apt.status}</span></td>
                  <td>
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusUpdate(apt._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderOverview = () => (
    <div className="admin-overview-grid">
      <section className="admin-hero-panel">
        <p className="eyebrow">Admin Workspace</p>
        <h1>Welcome, {user?.name}</h1>
        <p>Monitor the single hospital queue, manage appointments, and add walk-in patients.</p>
        <div className="patient-hero-actions">
          <button type="button" className="submit-btn" onClick={() => setActiveView('queue')}>Open Live Queue</button>
          <button type="button" className="secondary-btn" onClick={() => setActiveView('walkin')}>Add Walk-in</button>
        </div>
      </section>
      {renderStats()}
      <section className="section-card admin-main-card">
        <h2>Recent Appointments</h2>
        {appointments.slice(0, 5).length === 0 ? (
          <p className="empty-state">No recent appointments.</p>
        ) : (
          <div className="admin-recent-list">
            {appointments.slice(0, 5).map((apt) => (
              <div key={apt._id} className="admin-recent-item">
                <div>
                  <strong>{apt.userId?.name || 'Walk-in'}</strong>
                  <p>{apt.hospitalId?.name} - {apt.disease}</p>
                </div>
                <span className="queue-pill">#{apt.queueNumber}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderQueue = () => (
    <section className="admin-main-card">
      <div className="queue-panel admin-queue-panel">
        <QueueDashboard token={token} />
      </div>
    </section>
  );

  const renderWalkIn = () => (
    <section className="section-card admin-main-card">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Walk-in Patient</p>
          <h2>Add Walk-in to Queue</h2>
        </div>
      </div>
      <form onSubmit={handleAddWalkIn} className="booking-form">
        <div className="form-row">
          <div className="form-group">
            <label>Patient Name</label>
            <input
              type="text"
              value={walkInData.patientName}
              onChange={(e) => setWalkInData({ ...walkInData, patientName: e.target.value })}
              placeholder="Walk-in name"
            />
          </div>
          <div className="form-group">
            <label>Age Group</label>
            <select value={walkInData.ageGroup} onChange={(e) => setWalkInData({ ...walkInData, ageGroup: e.target.value })} required>
              <option value="">Select age group</option>
              {ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Age Group</label>
            <select value={walkInData.ageGroup} onChange={(e) => setWalkInData({ ...walkInData, ageGroup: e.target.value })} required>
              <option value="">Select age group</option>
              {ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Disease / Condition</label>
            <select value={walkInData.disease} onChange={(e) => setWalkInData({ ...walkInData, disease: e.target.value })} required>
              <option value="">Select condition</option>
              {diseases.map((disease) => <option key={disease} value={disease}>{disease}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Visit Type</label>
            <select value={walkInData.visitType} onChange={(e) => setWalkInData({ ...walkInData, visitType: e.target.value })} required>
              {visitTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="submit-btn">Add Walk-in</button>
      </form>
    </section>
  );

  const renderHospitals = () => (
    <div className="admin-hospital-grid">
      <section className="section-card admin-main-card">
        <h2>Hospital Management</h2>
        <p className="empty-state">Hospital management is disabled in single-hospital mode.</p>
      </section>
    </div>
  );

  const renderContent = () => {
    if (activeView === 'queue') return renderQueue();
    if (activeView === 'appointments') return renderAppointmentsTable();
    if (activeView === 'walkin') return renderWalkIn();
    if (activeView === 'hospitals') return renderHospitals();
    return renderOverview();
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'queue', label: 'Live Queue' },
    { id: 'appointments', label: 'Appointments', count: appointments.length },
    { id: 'walkin', label: 'Walk-in Patient' },
    { id: 'hospitals', label: 'Hospital Management' }
  ];

  return (
    <div className={`admin-shell ${menuOpen ? 'menu-open' : ''}`}>
      <Toast message={toastMessage} type={toastType} />
      <button
        type="button"
        className="hamburger-btn"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Open menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {menuOpen && <button type="button" className="menu-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className="admin-sidebar">
        <div className="patient-profile-block">
          <div className="patient-avatar admin-avatar">A</div>
          <div>
            <h2>{user?.name}</h2>
            <p>Administrator</p>
          </div>
        </div>

        <nav className="patient-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'active' : ''}
              onClick={() => changeView(item.id)}
            >
              <span>{item.label}</span>
              {typeof item.count === 'number' && <strong>{item.count}</strong>}
            </button>
          ))}
        </nav>

        <button type="button" className="patient-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-content">
        {error && <div className="error-alert">{error}</div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
