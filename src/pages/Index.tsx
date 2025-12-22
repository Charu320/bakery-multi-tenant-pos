import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { OrderForm } from "@/components/OrderForm";
import { OrderHistory } from "@/components/OrderHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardList, History, LogOut, User } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleOrderCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Royal Live Bakery" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-gold font-display text-xl font-semibold">Royal Live Bakery</h1>
                <p className="text-muted-foreground text-xs">Order Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm">
                <User className="h-4 w-4" />
                <span>{session.user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="new-order" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger 
              value="new-order" 
              className="data-[state=active]:bg-gold data-[state=active]:text-background"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              New Order
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-gold data-[state=active]:text-background"
            >
              <History className="h-4 w-4 mr-2" />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-order" className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-gold font-display text-3xl font-semibold">Create New Order</h2>
              <p className="text-muted-foreground mt-1">Fill in the details to book a new cake order</p>
            </div>
            <OrderForm onOrderCreated={handleOrderCreated} />
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-gold font-display text-3xl font-semibold">Order History</h2>
              <p className="text-muted-foreground mt-1">View and manage all cake orders</p>
            </div>
            <OrderHistory refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
