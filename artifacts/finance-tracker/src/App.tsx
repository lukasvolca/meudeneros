import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Categories = lazy(() => import("@/pages/Categories"));
const Bills = lazy(() => import("@/pages/Bills"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/Login"));

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    );
  }

  return (
    <FinanceProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Suspense fallback={null}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/categories" component={Categories} />
            <Route path="/bills" component={Bills} />
            <Route path="/reports" component={Categories} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </WouterRouter>
    </FinanceProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AppRoutes />
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
