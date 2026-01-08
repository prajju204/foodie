import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import BookCatering from "./pages/BookCatering";
import ManageUsers from "./pages/ManageUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected route for customers */}
            <Route path="/book" element={
              <ProtectedRoute>
                <BookCatering />
              </ProtectedRoute>
            } />
            
            {/* Admin-only routes */}
            <Route path="/dashboard" element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            } />
            <Route path="/orders" element={
              <AdminRoute>
                <Orders />
              </AdminRoute>
            } />
            <Route path="/orders/:id" element={
              <AdminRoute>
                <OrderDetail />
              </AdminRoute>
            } />
            <Route path="/menu" element={
              <AdminRoute>
                <Menu />
              </AdminRoute>
            } />
            <Route path="/inventory" element={
              <AdminRoute>
                <Inventory />
              </AdminRoute>
            } />
            <Route path="/staff" element={
              <AdminRoute>
                <Staff />
              </AdminRoute>
            } />
            <Route path="/customers" element={
              <AdminRoute>
                <Customers />
              </AdminRoute>
            } />
            <Route path="/reports" element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            } />
            <Route path="/settings" element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            } />
            <Route path="/manage-users" element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
