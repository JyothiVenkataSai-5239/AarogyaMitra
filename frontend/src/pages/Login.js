import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HospitalMark } from "../components/ui";

// Redesigned Login page (UI only) — preserves all existing functionality.
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      onLogin(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError("Error connecting to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex overflow-hidden bg-slate-50">
      {/* Left visual: centered photo card with heading above it */}
      <aside className="hidden md:flex md:w-2/5 lg:w-1/2 min-h-screen items-center justify-center bg-slate-100 px-8 py-12">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-700 font-semibold">Trusted care, right from the start</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Vijaya Multi Specialty Hospital</h2>
          </div>

          <div className="mx-auto w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <img
              src="/assets/vijaya-hero.png"
              alt="Vijaya Multi Specialty Hospital"
              className="w-full h-auto object-contain"
              style={{ maxHeight: '76vh' }}
            />
          </div>

          <p className="text-sm text-slate-600">Patient-first service with digital queue updates, appointment control, and faster admissions.</p>
        </div>
      </aside>

      {/* Right side: login card */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fadeInUp">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-6">
              <div style={{ transform: 'scale(0.8)' }}>
                <HospitalMark />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome Back</h1>
                <p className="text-sm text-slate-500">Sign in to continue to your account</p>
              </div>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.34A2 2 0 014 5h12a2 2 0 011.06.34l-7.06 4.18L2.94 6.34z" /><path d="M18 8.69v6.06A2 2 0 0116 17H4a2 2 0 01-2-2V8.69l8 4.73 8-4.73z" /></svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 8a5 5 0 1110 0v1h1a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5a2 2 0 012-2h1V8zm2 1V8a3 3 0 116 0v1H7z" clipRule="evenodd" /></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 pl-10 pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2563EB] hover:text-[#0ea5b3] transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/" className="text-sm text-[#2563EB] hover:underline">Forgot password?</Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white px-4 py-2 font-semibold hover:opacity-95 disabled:opacity-60 transition"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-sm text-center">
              New here? <Link to="/register" className="text-[#2563EB] font-semibold">Create an account</Link>
            </div>

            <div className="mt-6 text-xs text-slate-400">
              <strong>Demo access</strong>
              <div>Patient: patient@gmail.com / patient123</div>
              <div>Admin: admin@hospital.com / admin123</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
