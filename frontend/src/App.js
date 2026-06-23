import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardOverview from "./features/dashboard/DashboardOverview";
import PAPRegistryList from "./features/budget-registry/PAPRegistryList";
import PAPDetailView from "./features/budget-registry/PAPDetailView";
import Obligations from "./features/transactions/Obligations";
import ProcurementRequests from "./features/transactions/ProcurementRequests";
import PAPUtilizationHeatmap from "./features/monitoring/PAPUtilizationHeatmap";
import MonitoringOverview from "./features/monitoring/MonitoringOverview";
import ImportCenter from "./features/admin/import/ImportCenter";
import ReviewQueue from "./features/review/ReviewQueue";
import ApprovalQueue from "./features/approval/ApprovalQueue";
import Reports from "./features/reports/Reports";
import AdminCenter from "./features/admin/AdminCenter";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="registry" element={<PAPRegistryList />} />
          <Route path="pap-detail/:id" element={<PAPDetailView />} />
          <Route path="create-pr" element={<ProcurementRequests />} />
          <Route path="create-obligation" element={<Obligations />} />
          <Route path="monitoring" element={<MonitoringOverview />} />
          <Route path="monitoring/heatmap" element={<PAPUtilizationHeatmap />} />
          <Route path="reports" element={<Reports />} />
          <Route path="review-queue" element={<ReviewQueue />} />
          <Route path="approval-queue" element={<ApprovalQueue />} />
          <Route path="import" element={<ImportCenter />} />
          <Route path="admin" element={<AdminCenter />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  );
}
