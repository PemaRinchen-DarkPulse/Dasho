import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your pages
import Index from "./pages/Index";
import Equipment from "./pages/Equipment";
import EquipmentDetail from "./pages/EquipmentDetail";
import BookingForm from "./pages/BookingForm";
import Bookings from "./pages/Bookings";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/toaster";
import RootLayout from "./pages/RootLayout";
import Maintenance from "./pages/Maintenance";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Index />} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            {/* Publicly accessible routes */}
            <Route path="equipment" element={<Equipment />} />
            <Route path="equipment/:id" element={<EquipmentDetail />} />
            <Route path="bookings" element={<Bookings />} />
            {/* Auth-required routes */}
            <Route element={<ProtectedRoute role={undefined} />}>
              <Route path="equipment/:id/book" element={<BookingForm />} />
              <Route path="my-bookings" element={<MyBookings />} />
            </Route>
            <Route path="maintenance" element={<Maintenance />} />
            {/* Admin protected route */}
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="admin-dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
