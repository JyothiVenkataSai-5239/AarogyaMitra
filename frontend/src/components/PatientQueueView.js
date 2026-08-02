import React, { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Loader, statusTone } from "./ui";
import { getSocket } from "../services/socket";
import { apiFetch, parseJson } from "../services/api";

// Using Tailwind utility classes instead of inline style objects

const PatientQueueView = ({ appointmentId, token }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [checkInStatus, setCheckInStatus] = useState(null);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJson(response);
      const apt = Array.isArray(data) ? data.find((item) => item._id === appointmentId) : null;
      if (apt) {
        setAppointment(apt);
        if (apt.notificationSent) {
          setNotifications([
            { id: 1, type: "queue-update", message: `Moved to queue #${apt.queueNumber}`, time: new Date(apt.lastQueueUpdateAt).toLocaleTimeString() },
            { id: 2, type: "scheduled", message: "Appointment confirmed", time: new Date(apt.createdAt).toLocaleTimeString() },
          ]);
        }
      }
      setError("");
    } catch (err) {
      setError("Failed to load appointment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId && token) {
      fetchAppointment();
      const interval = setInterval(fetchAppointment, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, token]);

  useEffect(() => {
    const socket = getSocket();
    const handleAppointmentUpdated = (event) => {
      if (!event?.appointmentId || event.appointmentId === appointmentId) fetchAppointment();
    };
    socket.on("appointment:updated", handleAppointmentUpdated);
    return () => socket.off("appointment:updated", handleAppointmentUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, token]);

  const handleCheckIn = async (isLate = false) => {
    try {
      const response = await apiFetch(`/api/appointments/${appointmentId}/check-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLate }),
      });

      if (response.ok) {
        const status = isLate ? "late" : "checked-in";
        setCheckInStatus(status);
        setNotifications((items) => [
          ...items,
          { id: items.length + 1, type: "checked-in", message: `Checked in ${isLate ? "(Late)" : "(On time)"}`, time: new Date().toLocaleTimeString() },
        ]);
      } else {
        setError("Check-in failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  if (loading) return <Loader label="Loading your appointment" />;

  if (!appointment) {
    return <EmptyState title="Appointment not found" message="We could not find this queue record for your account." />;
  }

  const estimatedTime = appointment.estimatedStartTime
    ? new Date(appointment.estimatedStartTime).toLocaleTimeString()
    : "Calculating";
  const wait = appointment.predictedWaitTime || 0;
  const progress = appointment.queueNumber ? Math.max(8, Math.min(100, 100 - appointment.queueNumber * 8)) : 0;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="bg-white rounded-2xl p-6 shadow-md" aria-label="Patient queue status">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Queue tracking</p>
            <h2 className="mt-1 text-3xl font-bold">Token #{appointment.queueNumber}</h2>
            <p className="text-sm text-slate-500">Your visit is being coordinated in real time.</p>
          </div>
          <Badge tone={statusTone(appointment.appointmentStatus)}>
            {appointment.appointmentStatus || "scheduled"}
          </Badge>
        </div>

        <div aria-label={`Queue progress ${progress}%`} className="mt-4 bg-slate-100 h-3 rounded-full overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Estimated start</div>
            <div className="font-semibold">{estimatedTime}</div>
          </div>
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Approx wait</div>
            <div className="font-semibold">{wait} min</div>
          </div>
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Doctor type</div>
            <div className="font-semibold">{appointment.doctorType}</div>
          </div>
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Condition</div>
            <div className="font-semibold">{appointment.disease}</div>
          </div>
        </div>

        {appointment.appointmentStatus === "scheduled" && !checkInStatus && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="success" onClick={() => handleCheckIn(false)}>
              Check in on time
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleCheckIn(true)}>
              Check in late
            </Button>
          </div>
        )}

        {checkInStatus && (
          <div className="mt-4">
            <Badge tone="success">Checked in {checkInStatus === "late" ? "late" : "on time"}</Badge>
          </div>
        )}

        {appointment.noShowRisk > 0.25 && (
          <div className="mt-4 p-3 rounded-lg border bg-amber-50 text-amber-700">Appointment confirmation needed. Please confirm your presence to reduce cancellation risk.</div>
        )}
      </section>

      <aside className="bg-white rounded-2xl p-6 shadow-md" aria-label="Queue notifications and appointment summary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Notifications</p>
            <h2 className="mt-0">Live updates</h2>
          </div>
          <Badge tone="accent">{notifications.length} updates</Badge>
        </div>

        {notifications.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No notifications yet" message="Queue changes and check-in activity will appear here." />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {notifications.map((notif, index) => (
              <article key={notif.id} className="grid grid-cols-[34px_1fr] gap-3 items-start">
                <span className="w-8 h-8 grid place-items-center rounded-lg bg-indigo-50 text-indigo-600 font-extrabold">{index + 1}</span>
                <div className="p-3 border rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between">
                    <strong>{notif.message}</strong>
                    <Badge tone={statusTone(notif.type)}>{notif.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{notif.time}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Visit type</div>
            <div className="font-semibold">{appointment.visitType}</div>
          </div>
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Consultation time</div>
            <div className="font-semibold">{appointment.consultTime || 15} min</div>
          </div>
          <div className="p-3 border rounded-lg bg-slate-50">
            <div className="text-xs uppercase text-slate-500 tracking-wider">Booked</div>
            <div className="font-semibold">{new Date(appointment.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PatientQueueView;
