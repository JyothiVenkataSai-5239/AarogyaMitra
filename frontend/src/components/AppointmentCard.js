import React from "react";
import { Badge, Button } from "./ui";

const HOSPITAL_NAME = "Vijaya Multi Speciality Hospital";

const AppointmentCard = ({ appointment, userName, onClose }) => {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="appointment-confirmed-title">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
        <div className="w-14 h-14 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 text-white grid place-items-center text-2xl font-extrabold mb-3">+</div>
        <Badge tone="success">Appointment confirmed</Badge>
        <h2 id="appointment-confirmed-title" className="text-2xl font-semibold mt-3">You are in the queue</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-[36rem] mx-auto">
          {userName ? `${userName}, ` : ""}your appointment has been confirmed at {HOSPITAL_NAME}.
        </p>

        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 inline-grid place-items-center mx-auto">
          <span className="text-xs uppercase text-slate-500 tracking-widest">Queue token</span>
          <strong className="text-4xl text-indigo-600">#{appointment.queueNumber}</strong>
        </div>

        <div className="mt-4 grid gap-3 text-left">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm font-semibold text-slate-500">Hospital</span>
            <strong className="text-sm text-slate-800">{HOSPITAL_NAME}</strong>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm font-semibold text-slate-500">Location</span>
            <strong className="text-sm text-slate-800">{appointment.hospitalLocation || HOSPITAL_NAME}</strong>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm font-semibold text-slate-500">Doctor type</span>
            <strong className="text-sm text-slate-800">{appointment.doctorType}</strong>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm font-semibold text-slate-500">Expected wait</span>
            <strong className="text-sm text-slate-800">Approx. {appointment.expectedTime ?? appointment.predictedWaitTime ?? "-"} minutes</strong>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-sm font-semibold text-slate-500">Date and time</span>
            <strong className="text-sm text-slate-800">{new Date(appointment.createdAt).toLocaleString()}</strong>
          </div>
        </div>

        {onClose && <div className="mt-6"><Button type="button" onClick={onClose}>Done</Button></div>}
      </div>
    </div>
  );
};

export default AppointmentCard;
