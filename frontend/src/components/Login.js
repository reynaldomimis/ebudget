import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Lock, AlertCircle, Loader2 } from "lucide-react";
import Button from "./common/Button";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const result = login(username, password);

      if (result.success) {
        console.log("Login successful:", result.user);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    setError("");
    if (field === "username") {
      setUsername(value);
    } else if (field === "password") {
      setPassword(value);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative items-center justify-center overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-800 rounded-full -mr-32 -mt-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-700 rounded-full -ml-24 -mb-24 opacity-20"></div>

        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-white text-4xl font-bold italic tracking-tighter">W</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">WFP System</h1>
          <p className="text-primary-100 text-lg max-w-md mx-auto leading-relaxed">
            A modern Work and Financial Plan Management System designed for government enterprise clarity and precision.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-neutral-50 p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
               <span className="text-white text-2xl font-bold italic tracking-tighter">W</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">WFP System</h2>
          </div>

          <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h2>
              <p className="text-neutral-500 text-sm">Please enter your credentials to access the system.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5" htmlFor="username">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-100 rounded-lg text-danger-700 text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-3"
                isLoading={isLoading}
                disabled={!username || !password}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-neutral-100">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Demo Credentials</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-xs font-medium text-neutral-700">Administrator</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">admin / admin123</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-xs font-medium text-neutral-700">Standard User</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">user1 / user123</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-neutral-400">
            &copy; 2024 WFP System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
