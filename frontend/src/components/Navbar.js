import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HospitalMark } from "./ui";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200" aria-label="Primary navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link to={user?.role === "admin" ? "/admin" : user ? "/dashboard" : "/login"} className="inline-flex items-center gap-3 text-slate-900 font-extrabold">
            <HospitalMark compact />
            <span className="hidden sm:inline">Vijaya Health</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-600 max-w-[180px] truncate">{user.name}</span>
                <Link to={user.role === "admin" ? "/admin" : "/dashboard"} className="text-sm text-slate-700 hover:text-indigo-600">{user.role === "admin" ? "Admin" : "Dashboard"}</Link>
                <button onClick={handleLogout} className="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-700 hover:text-indigo-600">Login</Link>
                <Link to="/register" className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-full">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
