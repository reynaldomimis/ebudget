import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ImportWFP from "./components/ImportWFP";
import Records from "./components/Records";
import Summary from "./components/Summary";
import { ToastContainer } from "react-toastify";
import "./App.css";

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
  // const testValues = [
  //   "300.00",
  //   "153.40",
  //   "51.75",
  //   "75.00",
  //   "11.00",
  //   "6.00",
  //   "450.00",
  //   "3,200.00",
  //   "7.20",
  //   "10.80",
  //   "1,500.00",
  //   "12,731.00",
  //   "107.80",
  //   "3,234.20",
  //   "94,760.00",
  // ];

  // console.log("===== CONVERT TO THOUSANDS TEST =====");

  // testValues.forEach((value) => {
  //   const output = convertToThousands(value);
  //   console.log(`${value}  →  ${output}`);
  // });

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
