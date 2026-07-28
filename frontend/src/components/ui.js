import React from "react";

export const HospitalMark = ({ compact = false }) => (
  <div className={`inline-flex items-center justify-center rounded-md ${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-indigo-600 text-white font-extrabold`} aria-hidden="true">
    <span>+</span>
  </div>
);

export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold focus:outline-none ${
      variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
      variant === 'secondary' ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' :
      variant === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
      'bg-gray-100 text-slate-700'
    } ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ children, className = "", ...props }) => (
  <section className={`bg-white rounded-2xl shadow p-4 ${className}`.trim()} {...props}>
    {children}
  </section>
);

export const Badge = ({ children, tone = "info", className = "" }) => (
  <span className={`inline-flex items-center gap-2 text-sm font-semibold px-2.5 py-1 rounded-full ${
    tone === 'success' ? 'bg-emerald-100 text-emerald-700' :
    tone === 'danger' ? 'bg-rose-100 text-rose-700' :
    tone === 'warning' ? 'bg-amber-100 text-amber-700' :
    tone === 'accent' ? 'bg-indigo-100 text-indigo-700' :
    'bg-slate-100 text-slate-700'
  } ${className}`.trim()}>{children}</span>
);

export const EmptyState = ({ title, message, action }) => (
  <div className="text-center p-6">
    <div className="mx-auto w-20 h-20 rounded-lg bg-slate-100 mb-4 grid place-items-center" aria-hidden="true">
      <span className="text-2xl text-slate-400">+</span>
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    {message && <p className="text-sm text-slate-500 mt-2">{message}</p>}
    <div className="mt-4">{action}</div>
  </div>
);

export const Loader = ({ label = "Loading" }) => (
  <div className="flex items-center gap-3 text-sm text-slate-600" role="status" aria-live="polite">
    <svg className="w-5 h-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
    <span>{label}</span>
  </div>
);

export const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-3 bg-slate-200 rounded w-full" />
    ))}
  </div>
);

export const statusTone = (status = "") => {
  const normalized = String(status).toLowerCase();
  if (["completed", "checked-in"].includes(normalized)) return "success";
  if (["cancelled", "no-show"].includes(normalized)) return "danger";
  if (["pending", "scheduled", "late"].includes(normalized)) return "warning";
  if (["in-progress"].includes(normalized)) return "accent";
  return "info";
};
