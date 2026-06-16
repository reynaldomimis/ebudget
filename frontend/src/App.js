import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ImportWFP from "./components/ImportWFP";
import Records from "./components/Records";
import Activities from "./components/Activities";
import Summary from "./components/Summary";
import { ToastContainer } from "react-toastify";
import "./App.css";
import BudgetForm from "./components/ui/BudgetForm";

function AppContent() {
  const [activeComponent, setActiveComponent] = useState("import");
  const { isLoggedIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.role === "Viewer") setActiveComponent("records");
      else setActiveComponent("import");
    }
  }, [isLoggedIn, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <Login />;

  const renderComponent = () => {
    switch (activeComponent) {
      case "import":
        return <ImportWFP />;
      case "entries":
        return <BudgetForm />;
      case "activities":
        return <Activities />;
      case "records":
        return <Records />;
      case "summary":
        return <Summary />;
      default:
        return <ImportWFP />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-3 bg-green-50">
        {renderComponent()}
      </main>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
