import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QueueDashboard from "../components/QueueDashboard";
import Toast from "../components/Toast";
import { Badge, Button, Card, EmptyState, Loader, Skeleton, statusTone } from "../components/ui";
import { getSocket } from "../services/socket";

const HOSPITAL_NAME = "Vijaya Multi Speciality Hospital";

const AdminDashboard = ({ user, token, onLogout }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [walkInData, setWalkInData] = useState({ patientName: "", ageGroup: "", disease: "", visitType: "Consultation" });

  const ageGroups = ["Child (0-12)", "Teen (13-17)", "Adult (18-40)", "Middle-aged (41-60)", "Senior (60+)"];
  const diseases = ["Fever", "Diabetes", "Heart Disease", "Cancer", "Fracture", "Neurological Disorder", "Kidney Disease", "Eye Problem", "Dental Issue", "General Checkup", "Other"];
  const visitTypes = ["Emergency", "Consultation", "Follow-up", "Routine Checkup"];

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Error fetching appointments: " + err.message);
      setToastType("error");
      setToastMessage("Failed to load appointments");
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
      setToastType("info");
      setToastMessage("Queue updated");
    };
    socket.on("queue:updated", handleQueueUpdated);
    return () => socket.off("queue:updated", handleQueueUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayApts = appointments.filter((apt) => new Date(apt.createdAt).toDateString() === today);
    return {
      totalToday: todayApts.length,
      pending: appointments.filter((apt) => apt.status === "Pending").length,
      completed: appointments.filter((apt) => apt.status === "Completed").length,
      cancelled: appointments.filter((apt) => apt.status === "Cancelled").length,
      walkIns: appointments.filter((apt) => apt.bookingSource === "walk-in").length,
    };
  }, [appointments]);

  const nextQueue = useMemo(
    () => appointments.filter((apt) => apt.status === "Pending").sort((a, b) => (a.queueNumber || 999) - (b.queueNumber || 999))[0],
    [appointments],
  );

  const handleLogout = () => {
    onLogout?.();
    navigate("/login");
  };

  const changeView = (viewId) => {
    setActiveView(viewId);
    setMenuOpen(false);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setToastType("success");
        setToastMessage("Appointment updated");
        await fetchAppointments();
      } else {
        setError("Failed to update appointment");
        setToastType("error");
        setToastMessage("Failed to update appointment");
      }
    } catch (err) {
      setError("Error updating appointment: " + err.message);
      setToastType("error");
      setToastMessage("Error updating appointment");
    }
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!walkInData.ageGroup || !walkInData.disease || !walkInData.visitType) {
      setError("Please fill all walk-in fields");
      return;
    }

    try {
      const response = await fetch("/api/admin/walk-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(walkInData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to add walk-in appointment");
        setToastType("error");
        setToastMessage(data.message || "Failed to add walk-in appointment");
        return;
      }

      setWalkInData({ patientName: "", ageGroup: "", disease: "", visitType: "Consultation" });
      setToastType("success");
      setToastMessage("Walk-in added to queue");
      setActiveView("queue");
      await fetchAppointments();
    } catch (err) {
      setError("Error adding walk-in appointment: " + err.message);
      setToastType("error");
      setToastMessage("Error adding walk-in appointment");
    }
  };

  const renderStats = () => (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-4">
      <Card className="p-4 text-center"><span className="text-2xl font-bold">{stats.totalToday}</span><p className="text-sm text-slate-500">Today's appointments</p></Card>
      <Card className="p-4 text-center"><span className="text-2xl font-bold">{stats.pending}</span><p className="text-sm text-slate-500">Waiting patients</p></Card>
      <Card className="p-4 text-center"><span className="text-2xl font-bold">{stats.completed}</span><p className="text-sm text-slate-500">Completed</p></Card>
      <Card className="p-4 text-center"><span className="text-2xl font-bold">{stats.cancelled}</span><p className="text-sm text-slate-500">Cancelled</p></Card>
      <Card className="p-4 text-center"><span className="text-2xl font-bold">{stats.walkIns}</span><p className="text-sm text-slate-500">Walk-ins</p></Card>
    </section>
  );

  const renderAppointmentsTable = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">Appointments</p>
          <h2 className="text-lg font-semibold">Professional appointment table</h2>
        </div>
        <Button type="button" variant="secondary" onClick={fetchAppointments}>Refresh</Button>
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" message="Appointments for this hospital will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Visit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Queue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Wait</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <strong>{apt.userId?.name || apt.patientName || "Walk-in"}</strong>
                      <span className="text-sm text-slate-500">{HOSPITAL_NAME}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{apt.bookingSource || "online"}</td>
                  <td className="px-4 py-3">{apt.disease}</td>
                  <td className="px-4 py-3">{apt.visitType}</td>
                  <td className="px-4 py-3">{apt.doctorType}</td>
                  <td className="px-4 py-3"><span className="text-indigo-600 font-bold">#{apt.queueNumber}</span></td>
                  <td className="px-4 py-3">{apt.predictedWaitTime ?? apt.expectedTime ?? "-"} min</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(apt.status)}>{apt.status}</Badge></td>
                  <td className="px-4 py-3">
                    <select value={apt.status} onChange={(e) => handleStatusUpdate(apt._id, e.target.value)} className="rounded-md border-gray-200 px-2 py-1">
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
    </Card>
  );

  const renderOverview = () => (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">
          <Badge tone="accent">Admin command center</Badge>
          <h1 className="mt-2 text-2xl font-semibold">Good day, {user?.name || "Administrator"}</h1>
          <p className="text-sm text-slate-600 mt-2">Monitor appointments, walk-ins, live queue movement, doctor readiness, and patient flow for {HOSPITAL_NAME}.</p>
          <div className="mt-4 flex gap-3">
            <Button type="button" onClick={() => changeView("queue")}>Open live queue</Button>
            <Button type="button" variant="secondary" onClick={() => changeView("walkin")}>Add walk-in</Button>
          </div>
        </div>

        <Card className="p-4">
          <p className="text-sm text-slate-500">Now serving</p>
          <h2 className="text-xl font-semibold">{nextQueue ? `Token #${nextQueue.queueNumber}` : "Queue clear"}</h2>
          <div className="text-sm text-slate-600">{nextQueue ? nextQueue.userId?.name || nextQueue.patientName || "Walk-in patient" : "No pending patients"}</div>
        </Card>

      </section>

      {renderStats()}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <p className="text-sm text-slate-500">Today's appointments</p>
          <h2 className="text-lg font-semibold">Recent patients</h2>
          {loading ? <Skeleton rows={5} /> : appointments.slice(0, 6).length === 0 ? (
            <EmptyState title="No recent patients" message="New bookings and walk-ins will appear here." />
          ) : (
            <div className="space-y-3 mt-3">
              {appointments.slice(0, 6).map((apt) => (
                <div key={apt._id} className="flex items-center justify-between">
                  <div>
                    <strong>{apt.userId?.name || apt.patientName || "Walk-in"}</strong>
                    <div className="text-sm text-slate-500">{apt.disease} · {apt.visitType}</div>
                  </div>
                  <div className="text-indigo-600 font-bold">#{apt.queueNumber}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Doctor status</p>
          <h2 className="text-lg font-semibold">Clinical availability</h2>
          <div className="mt-3 space-y-2">
            {[["General Physician", "Available"], ["Cardiologist", "Available"], ["Orthopedic", "In consultation"], ["Neurologist", "Available"]].map(([doctor, status], index) => (
              <div key={doctor} className="flex items-center justify-between">
                <span>{doctor}</span>
                <Badge tone={status === "Available" ? "success" : "warning"}>{status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );

  const renderWalkIn = () => (
    <Card className="p-4">
      <div className="mb-3">
        <p className="text-sm text-slate-500">Walk-in patient</p>
        <h2 className="text-lg font-semibold">Add patient to queue</h2>
      </div>
      <form onSubmit={handleAddWalkIn} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-700">Patient name</label>
            <input type="text" value={walkInData.patientName} onChange={(e) => setWalkInData({ ...walkInData, patientName: e.target.value })} placeholder="Walk-in name" className="mt-1 w-full rounded-md border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Age group</label>
            <select value={walkInData.ageGroup} onChange={(e) => setWalkInData({ ...walkInData, ageGroup: e.target.value })} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
              <option value="">Select age group</option>
              {ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-700">Disease / condition</label>
            <select value={walkInData.disease} onChange={(e) => setWalkInData({ ...walkInData, disease: e.target.value })} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
              <option value="">Select condition</option>
              {diseases.map((disease) => <option key={disease} value={disease}>{disease}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700">Visit type</label>
            <select value={walkInData.visitType} onChange={(e) => setWalkInData({ ...walkInData, visitType: e.target.value })} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
              {visitTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Button type="submit">Add walk-in to queue</Button>
        </div>
      </form>
    </Card>
  );

  const navItems = [
    { id: "overview", label: "Overview", glyph: "01" },
    { id: "queue", label: "Live Queue", glyph: "02" },
    { id: "appointments", label: "Appointments", glyph: "03", count: appointments.length },
    { id: "walkin", label: "Walk-in", glyph: "04" },
    { id: "hospitals", label: "Hospital", glyph: "05" },
  ];

  const renderContent = () => {
    if (activeView === "queue") return <Card className="admin-main-card"><QueueDashboard token={token} /></Card>;
    if (activeView === "appointments") return renderAppointmentsTable();
    if (activeView === "walkin") return renderWalkIn();
    if (activeView === "hospitals") {
      return <Card><EmptyState title="Single-hospital mode" message="Hospital management is disabled because this deployment is configured for Vijaya Hospital." /></Card>;
    }
    return renderOverview();
  };

  return (
    <div className={`min-h-screen flex bg-slate-50 ${menuOpen ? "overflow-hidden" : ""}`}>
      <Toast message={toastMessage} type={toastType} />

      {/* Mobile hamburger */}
      <button type="button" className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">
        <span className="block w-5 h-[2px] bg-slate-700 mb-1" />
        <span className="block w-5 h-[2px] bg-slate-700 mb-1" />
        <span className="block w-5 h-[2px] bg-slate-700" />
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r p-4 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-md flex items-center justify-center">+</div>
          <div>
            <strong className="block">Vijaya HMS</strong>
            <span className="text-xs text-slate-500">Operations console</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button key={item.id} type="button" onClick={() => changeView(item.id)} className={`flex items-center justify-between gap-3 w-full text-left px-3 py-2 rounded-md ${activeView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{item.glyph}</span>
                <span>{item.label}</span>
              </div>
              {typeof item.count === 'number' && <strong className="text-sm">{item.count}</strong>}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-red-600 bg-red-50">Logout</button>
        </div>
      </aside>

      {/* Backdrop for mobile when menu is open */}
      {menuOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">Hospital operations</p>
            <h1 className="text-2xl font-semibold">{HOSPITAL_NAME}</h1>
          </div>
          {loading && <Loader label="Syncing data" />}
        </header>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
