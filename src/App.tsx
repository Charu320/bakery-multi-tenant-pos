import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// import AdminGuard from "./components/AdminGuard";
import AdminDashboard from "./components/AdminDashboard";
import { AuthForm } from "./components/AuthForm";
import KitchenOrderScreen from "./components/KitchenOrderScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { OrderForm } from "./components/OrderForm";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<AuthForm />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["admin", "manager"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      {/* Admin + Manager */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute allow={["admin", "manager", "kitchen"]}>
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
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
