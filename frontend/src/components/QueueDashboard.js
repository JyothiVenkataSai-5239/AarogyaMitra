import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Loader, Skeleton, statusTone } from "./ui";
import { getSocket } from "../services/socket";

const QueueDashboard = ({ token }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionData, setActionData] = useState({});

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQueue(data.appointments || []);
      setError("");
    } catch (err) {
      setError("Failed to load queue: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    const handleQueueUpdated = () => fetchQueue();
    socket.on("queue:updated", handleQueueUpdated);
    return () => socket.off("queue:updated", handleQueueUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAction = async (appointmentId, action) => {
    try {
      let endpoint = "";
      const method = "POST";
      let body = {};

      switch (action) {
        case "no-show":
          endpoint = `/api/admin/appointments/${appointmentId}/no-show`;
          break;
        case "complete":
          endpoint = `/api/admin/appointments/${appointmentId}/complete`;
          break;
        case "early-finish":
          endpoint = `/api/admin/appointments/${appointmentId}/early-finish`;
          body = { minutesEarlyBy: actionData.minutesEarly || 5 };
          break;
        case "delay":
          endpoint = "/api/admin/queue/delay";
          body = { delayMinutes: actionData.delayMinutes || 10 };
          break;
        case "recalculate":
          endpoint = "/api/admin/queue/recalculate";
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchQueue();
        setSelectedAction(null);
        setActionData({});
      } else {
        setError("Action failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const queueSummary = useMemo(() => {
    const current = queue[0];
    const avgWait = queue.length
      ? Math.round(queue.reduce((sum, apt) => sum + (apt.predictedWaitTime || 0), 0) / queue.length)
      : 0;
    return { current, avgWait };
  }, [queue]);

  return (
    <div className="bg-slate-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">Live queue</p>
          <h2 className="text-lg font-semibold">Vijaya Hospital patient flow</h2>
        </div>
        {loading && <Loader label="Refreshing" />}
      </div>

      {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start mb-4">
        <div className="col-span-1 bg-white p-4 rounded-2xl shadow">
          <span className="text-xs text-slate-500">Current token</span>
          <div className="mt-2 text-2xl font-extrabold">{queueSummary.current ? `#${queueSummary.current.queueNumber}` : "-"}</div>
          <p className="text-sm text-slate-600 mt-1">{queueSummary.current?.userId?.name || queueSummary.current?.patientName || "Queue waiting for patients"}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start justify-center">
          <div className="text-2xl font-bold">{queue.length}</div>
          <div className="text-sm text-slate-500">In queue</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start justify-center">
          <div className="text-2xl font-bold">{queueSummary.avgWait}</div>
          <div className="text-sm text-slate-500">Avg wait min</div>
        </div>

        <div className="flex gap-2 justify-end items-center">
          <Button type="button" variant="secondary" onClick={() => setSelectedAction("delay")}>Doctor delay</Button>
          <Button type="button" onClick={() => handleAction(null, "recalculate")}>Recalculate</Button>
          <Button type="button" variant="secondary" onClick={fetchQueue}>Refresh</Button>
        </div>
      </section>

      {selectedAction === "delay" && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="mb-2">
            <p className="text-sm text-slate-500">Delay queue</p>
            <h3 className="text-lg font-semibold">Record doctor delay</h3>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Minutes"
              value={actionData.delayMinutes || ""}
              onChange={(e) => setActionData({ ...actionData, delayMinutes: parseInt(e.target.value, 10) })}
              min="1"
              max="120"
              className="w-32 rounded-md border-gray-200 px-3 py-2"
            />
            <Button type="button" onClick={() => handleAction(null, "delay")}>Apply</Button>
            <Button type="button" variant="secondary" onClick={() => setSelectedAction(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading && queue.length === 0 ? (
        <Skeleton rows={7} />
      ) : queue.length === 0 ? (
        <EmptyState title="Queue is clear" message="Pending appointments and walk-ins will appear here in real time." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Token</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check-in</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Wait</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Risk</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((apt) => (
                <tr key={apt._id} className="border-t">
                  <td className="px-4 py-3"><span className="text-indigo-600 font-bold">#{apt.queueNumber}</span></td>
                  <td className="px-4 py-3"><strong>{apt.userId?.name || apt.patientName || "Unknown"}</strong></td>
                  <td className="px-4 py-3">{apt.disease}</td>
                  <td className="px-4 py-3">{apt.doctorType}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(apt.appointmentStatus)}>{apt.appointmentStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone(apt.checkInStatus)}>{apt.checkInStatus || "not checked-in"}</Badge></td>
                  <td className="px-4 py-3">{apt.predictedWaitTime ? `${apt.predictedWaitTime} min` : "-"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={apt.noShowRisk > 0.3 ? "danger" : apt.noShowRisk > 0.15 ? "warning" : "success"}>
                      {((apt.noShowRisk || 0) * 100).toFixed(0)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button type="button" variant="success" onClick={() => handleAction(apt._id, "complete")} disabled={apt.appointmentStatus === "completed"}>Done</Button>
                      <Button type="button" variant="danger" onClick={() => handleAction(apt._id, "no-show")} disabled={apt.appointmentStatus === "no-show"}>No-show</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QueueDashboard;
