import React, { useEffect, useState, useCallback } from "react";
import AppointmentCard from "../components/AppointmentCard";
import PatientQueueView from "../components/PatientQueueView";
import Toast from "../components/Toast";
import { Badge, Button, Card, EmptyState, Loader, statusTone } from "../components/ui";
import { apiFetch, parseJson } from "../services/api";

const HOSPITAL_NAME = "Vijaya Multi Speciality Hospital";

const UserDashboard = ({ user, token }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({ ageGroup: "", disease: "", visitType: "Consultation" });

  const ageGroups = ["Child (0-12)", "Teen (13-17)", "Adult (18-40)", "Middle-aged (41-60)", "Senior (60+)"];
  const diseases = ["Fever", "Diabetes", "Heart Disease", "Cancer", "Fracture", "Neurological Disorder", "Other"];
  const visitTypes = ["Consultation", "Follow-up", "Emergency"];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJson(res);
      setAppointments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load appointments: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchAppointments(); }, [token, fetchAppointments]);

  const presentAppointments = appointments.filter(a => (a.appointmentStatus || a.status) !== 'completed');
  const pastAppointments = appointments.filter(a => (a.appointmentStatus || a.status) === 'completed');
  const nextAppointment = appointments.find(a => (a.appointmentStatus || a.status) === 'scheduled' || (a.appointmentStatus || a.status) === 'checked-in');

  const handleFormChange = (e) => setFormData(s => ({ ...s, [e.target.name]: e.target.value }));

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, hospital: HOSPITAL_NAME }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      setBookingResult(data.appointment || data);
      setShowConfirmation(true);
      await fetchAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <Toast message={error} type={error ? 'error' : 'info'} />

      <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Patient workspace</p>
          <h1 className="text-2xl font-semibold">Good health starts here, {user?.name?.split(' ')[0] || 'Patient'}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow">
            <Badge tone="accent">{HOSPITAL_NAME}</Badge>
            <h2 className="mt-2 text-lg font-semibold">Your appointments, queue status, and visit plan in one calm dashboard.</h2>
            <p className="text-sm text-slate-600 mt-2">Book care, monitor waiting time, and stay updated as the live queue changes.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow flex items-center justify-center">
            <img src="/assets/ai-banner.svg" alt="Healthcare appointment dashboard illustration" className="max-w-full h-40 object-contain" />
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" aria-label="Appointment statistics">
          <Card className="p-4"><span className="text-2xl font-bold">{presentAppointments.length}</span><p className="text-sm text-slate-500">Upcoming appointments</p></Card>
          <Card className="p-4"><span className="text-2xl font-bold">{nextAppointment?.predictedWaitTime ?? '-'}</span><p className="text-sm text-slate-500">Estimated wait (min)</p></Card>
          <Card className="p-4"><span className="text-2xl font-bold">{pastAppointments.length}</span><p className="text-sm text-slate-500">Completed history</p></Card>
          <Card className="p-4"><span className="text-2xl font-bold">{nextAppointment?.queueNumber ? `#${nextAppointment.queueNumber}` : '-'}</span><p className="text-sm text-slate-500">Current queue token</p></Card>
        </section>

        <section id="queue">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Queue tracking</p>
              <h2 className="text-lg font-semibold">Live appointment progress</h2>
            </div>
            {nextAppointment && <Badge tone={statusTone(nextAppointment.appointmentStatus || nextAppointment.status)}>Live updates</Badge>}
          </div>
          {nextAppointment ? (
            <PatientQueueView appointmentId={nextAppointment._id} token={token} />
          ) : (
            <EmptyState
              title="Queue tracking is waiting"
              message="Once an appointment is active, this page shows check-in, wait time, status, and notification history."
              action={<Button type="button" onClick={() => { document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }); }}>Book appointment</Button>}
            />
          )}
        </section>

        <Card id="book" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Appointment booking</p>
              <h2 className="text-lg font-semibold">Choose the care you need</h2>
            </div>
            {loading && <Loader label="Working" />}
          </div>

          <form onSubmit={handleBookAppointment} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700">Hospital</label>
                <input type="text" value={HOSPITAL_NAME} readOnly className="mt-1 w-full rounded-md border-gray-200 px-3 py-2" />
              </div>
              <div>
                <label htmlFor="ageGroup" className="block text-sm text-slate-700">Age group</label>
                <select id="ageGroup" name="ageGroup" value={formData.ageGroup} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
                  <option value="">Select age group</option>
                  {ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="disease" className="block text-sm text-slate-700">Reason for visit</label>
                <select id="disease" name="disease" value={formData.disease} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
                  <option value="">Select condition</option>
                  {diseases.map((disease) => <option key={disease} value={disease}>{disease}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="visitType" className="block text-sm text-slate-700">Visit type</label>
                <select id="visitType" name="visitType" value={formData.visitType} onChange={handleFormChange} required className="mt-1 w-full rounded-md border-gray-200 px-3 py-2">
                  <option value="">Select visit type</option>
                  {visitTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Booking..." : "Confirm appointment"}</Button>
          </form>
        </Card>

        <section id="appointments" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <p className="text-sm text-slate-500">Upcoming</p>
            <h2 className="text-lg font-semibold">Appointment cards</h2>
            {presentAppointments.length === 0 ? <EmptyState title="No upcoming appointments" message="Book a visit to start your care journey." /> : (
              <div className="space-y-3 mt-3">
                {presentAppointments.map((apt) => (
                  <div key={apt._id} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{apt.userId?.name || apt.patientName || 'You'}</strong>
                        <div className="text-sm text-slate-500">{apt.disease} · {apt.visitType}</div>
                      </div>
                      <div className="text-indigo-600 font-bold">#{apt.queueNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <p className="text-sm text-slate-500">History</p>
            <h2 className="text-lg font-semibold">Past visits</h2>
            {pastAppointments.length === 0 ? <EmptyState title="No past appointments" message="Completed or cancelled appointments will be listed here." /> : (
              <div className="space-y-3 mt-3">
                {pastAppointments.map((apt) => (
                  <div key={apt._id} className="p-3 border rounded-lg bg-white">
                    <strong>{apt.userId?.name || apt.patientName || 'You'}</strong>
                    <div className="text-sm text-slate-500">{apt.disease} · {apt.visitType}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>

      {showConfirmation && (
        <AppointmentCard appointment={bookingResult} userName={user?.name} onClose={() => setShowConfirmation(false)} />
      )}
    </div>
  );
};

export default UserDashboard;
