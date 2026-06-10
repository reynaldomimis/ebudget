import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock user data
const mockUsers = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "user1", password: "user123", role: "User" },
  { username: "viewer", password: "view123", role: "Viewer" }
];

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('wfp_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('wfp_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user session to localStorage whenever user changes
  useEffect(() => {
    if (user && isLoggedIn) {
      localStorage.setItem('wfp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wfp_user');
    }
  }, [user, isLoggedIn]);

  const login = (username, password) => {
    // Find user in mock data
    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      const userData = {
        username: foundUser.username,
        role: foundUser.role
      };
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true, user: userData };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('wfp_user');
  };

  const hasPermission = (requiredRole) => {
    if (!user || !isLoggedIn) return false;
    
    const roleHierarchy = {
      'Admin': 3,
      'User': 2,
      'Viewer': 1
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
