import React from "react";

const Toast = ({ message, type = "info" }) => {
  if (!message) return null;
  const tone =
    type === "success" ? "bg-emerald-50 text-emerald-800" :
    type === "error" ? "bg-rose-50 text-rose-800" :
    "bg-slate-50 text-slate-800";

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-md shadow ${tone}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80" aria-hidden="true" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
