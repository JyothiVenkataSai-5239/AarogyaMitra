import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { apiFetch, parseJson } from '../services/api';

const QueueDashboard = ({ token }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionData, setActionData] = useState({});

  // Fetch queue data
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await parseJson(response);
      setQueue((data && data.appointments) || []);
      setError('');
    } catch (err) {
      setError('Failed to load queue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const socket = getSocket();

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    socket.on('queue:updated', handleQueueUpdated);
    return () => {
      socket.off('queue:updated', handleQueueUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle appointment actions
  const handleAction = async (appointmentId, action) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'no-show':
          endpoint = `/api/admin/appointments/${appointmentId}/no-show`;
          break;
        case 'complete':
          endpoint = `/api/admin/appointments/${appointmentId}/complete`;
          break;
        case 'early-finish':
          endpoint = `/api/admin/appointments/${appointmentId}/early-finish`;
          body = { minutesEarlyBy: actionData.minutesEarly || 5 };
          break;
        case 'delay':
          endpoint = '/api/admin/queue/delay';
          body = { delayMinutes: actionData.delayMinutes || 10 };
          break;
        case 'recalculate':
          endpoint = '/api/admin/queue/recalculate';
          break;
        default:
          return;
      }

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchQueue();
        setSelectedAction(null);
        setActionData({});
      } else {
        setError('Action failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'checked-in': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'no-show': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCheckInColor = (status) => {
    const colors = {
      'checked-in': 'bg-green-100 text-green-800',
      'late': 'bg-orange-100 text-orange-800',
      'not-checked-in': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && queue.length === 0) {
    return <div className="p-4 text-center">Loading queue...</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Live Hospital Queue</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setSelectedAction('delay')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Doctor Delay
        </button>
        <button
          onClick={() => handleAction(null, 'recalculate')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Recalculate Queue
        </button>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      {/* Action Dialog */}
      {selectedAction === 'delay' && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
          <h3 className="font-bold mb-2">Record Doctor Delay</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Minutes"
              value={actionData.delayMinutes || ''}
              onChange={(e) => setActionData({ ...actionData, delayMinutes: parseInt(e.target.value) })}
              className="border px-3 py-2 rounded flex-1"
              min="1"
              max="120"
            />
            <button
              onClick={() => handleAction(null, 'delay')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Apply
            </button>
            <button
              onClick={() => setSelectedAction(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="border p-2 text-left">Queue #</th>
              <th className="border p-2 text-left">Patient Name</th>
              <th className="border p-2 text-left">Disease</th>
              <th className="border p-2 text-left">Doctor Type</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Check-In</th>
              <th className="border p-2 text-left">Wait Time</th>
              <th className="border p-2 text-left">No-Show Risk</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan="9" className="border p-4 text-center text-gray-500">
                  No appointments in queue
                </td>
              </tr>
            ) : (
              queue.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50 border-b">
                  <td className="border p-2">
                    <span className="font-bold text-lg text-blue-600">#{apt.queueNumber}</span>
                  </td>
                  <td className="border p-2">{apt.userId?.name || 'Unknown'}</td>
                  <td className="border p-2">{apt.disease}</td>
                  <td className="border p-2">{apt.doctorType}</td>
                  <td className="border p-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(apt.appointmentStatus)}`}>
                      {apt.appointmentStatus}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getCheckInColor(apt.checkInStatus)}`}>
                      {apt.checkInStatus}
                    </span>
                  </td>
                  <td className="border p-2">
                    {apt.predictedWaitTime ? `${apt.predictedWaitTime} min` : '-'}
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                      apt.noShowRisk > 0.3 ? 'bg-red-100 text-red-800' :
                      apt.noShowRisk > 0.15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(apt.noShowRisk * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleAction(apt._id, 'complete')}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        disabled={apt.appointmentStatus === 'completed'}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleAction(apt._id, 'no-show')}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        disabled={apt.appointmentStatus === 'no-show'}
                      >
                        No-Show
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueueDashboard;
