import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

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
        // Login successful - App.js will handle redirect
        console.log("Login successful:", result.user);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    // Clear error when user starts typing
    setError(""); 
    if (field === "username") {
      setUsername(value);
    } else if (field === "password") {
      setPassword(value);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Large LOGIN Text */}
      <div className="login-left">
        <div className="login-left-content">
          <h1 className="login-title">eBudget</h1>
          {/* <p className="login-subtitle">WFP System</p> */}
          <p className="login-description">
            Work and Financial Plan Management System
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            {/* <h2 className="login-form-title">eBudget System</h2> */}
            <p className="login-form-subtitle">Sign in to your account</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="demo-accounts">
            <p className="demo-title">Demo Accounts:</p>
            <div className="demo-account-list">
              <div className="demo-account">
                <strong>Admin:</strong> admin / admin123
              </div>
              <div className="demo-account">
                <strong>User:</strong> user1 / user123
              </div>
              <div className="demo-account">
                <strong>Viewer:</strong> viewer / view123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
