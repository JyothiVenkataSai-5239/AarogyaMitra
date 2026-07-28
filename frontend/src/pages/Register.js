import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HospitalMark } from "../components/ui";

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "user", adminInviteCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }
      onLogin && onLogin(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError("Error connecting to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:block md:w-1/2 lg:w-2/3 bg-indigo-700 text-white">
        <div className="h-full p-12 flex flex-col justify-center gap-8">
          <div className="flex items-start gap-4">
            <HospitalMark />
            <div>
              <p className="font-bold">Vijaya Multi Speciality Hospital</p>
              <h1 className="text-4xl font-extrabold">Join a smarter hospital visit experience.</h1>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-lg max-w-lg">
            <img src="/assets/ai-banner.svg" alt="Digital healthcare illustration" className="w-full rounded" />
            <div className="mt-4 bg-white/90 p-3 rounded flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
              <div>
                <strong>Care journey ready</strong>
                <p className="text-sm">Book, check queue progress, and receive real-time visit updates.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-white max-w-sm">
            <span>Fast appointment booking</span>
            <span>Queue tracking after confirmation</span>
            <span>Admin console for hospital teams</span>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow">
          <div className="flex items-start gap-3 mb-4">
            <HospitalMark compact />
            <div>
              <p className="text-sm text-slate-500">Create account</p>
              <h2 className="text-xl font-semibold">Start with Vijaya Hospital</h2>
              <span className="text-sm text-slate-500">Use patient access for appointments or admin access with an invite code.</span>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-700">Full name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" autoComplete="name" required className="mt-1 w-full rounded-md border-gray-200" />
              </div>
              <div>
                <label className="block text-sm text-slate-700">Email address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required className="mt-1 w-full rounded-md border-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" autoComplete="new-password" required className="mt-1 w-full rounded-md border-gray-200 pr-20" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-indigo-600">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700">Confirm password</label>
                <input type={showPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" required className="mt-1 w-full rounded-md border-gray-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700">Account type</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-200">
                <option value="user">Patient</option>
                <option value="admin">Hospital administrator</option>
              </select>
            </div>

            {formData.role === "admin" && (
              <div>
                <label className="block text-sm text-slate-700">Admin invite code</label>
                <input type="password" id="adminInviteCode" name="adminInviteCode" value={formData.adminInviteCode} onChange={handleChange} placeholder="Enter invite code" required className="mt-1 w-full rounded-md border-gray-200" />
              </div>
            )}

            <div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            Already registered? <Link to="/login" className="text-indigo-600">Sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Register;
