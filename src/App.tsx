import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./components/AdminDashboard";
import { AuthForm } from "./components/AuthForm";
import KitchenOrderScreen from "./components/KitchenOrderScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { OrderForm } from "./components/OrderForm";
import { AdminOutletProvider } from "./context/AdminOutletContext";
import { startAutoSync } from "./lib/syncService";

const queryClient = new QueryClient();

const App = () => {
  // Initialize offline sync service
  useEffect(() => {
    const cleanup = startAutoSync();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AdminOutletProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthForm onSuccess={() =>window.location.replace("/")}/>}  />
{/* Admin Only */}
              <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["admin"]}>
              
             <AdminDashboard />
            
            </ProtectedRoute>
          }
        />
        {/* Admin + Manager */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute allow={["admin", "manager"]}>
          
              <OrderForm />
              
            </ProtectedRoute>
          }
          />
          {/* Admin + Manager + Kitchen */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allow={["admin", "manager", "kitchen"]}>
             
              <KitchenOrderScreen />
             
            </ProtectedRoute>
          }
          />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AdminOutletProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
