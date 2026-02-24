import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Planning from "./pages/Planning";
import Contractors from "./pages/Contractors";
import UserManagement from "./pages/UserManagement";
import Maintenance from "./pages/Maintenance";
import AdminDivision from "./pages/AdminDivision";

// Wrapper component for protected routes
function Protected({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  return <ProtectedRoute requireAdmin={requireAdmin}>{children}</ProtectedRoute>;
}

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path={"/login"} component={Login} />
      
      {/* Protected routes - require login and approval */}
      <Route path={"/"}>
        <Protected><Home /></Protected>
      </Route>
      <Route path={"/profile"}>
        <Protected><Profile /></Protected>
      </Route>
      <Route path={"/projects"}>
        <Protected><Projects /></Protected>
      </Route>
      <Route path={"/planning"}>
        <Protected><Planning /></Protected>
      </Route>
      <Route path={"/documents"}>
        <Protected><Documents /></Protected>
      </Route>
      <Route path={"/admin-division"}>
        <Protected><AdminDivision /></Protected>
      </Route>
      <Route path={"/tasks"}>
        <Protected><Tasks /></Protected>
      </Route>
      <Route path={"/contractors"}>
        <Protected><Contractors /></Protected>
      </Route>
      <Route path={"/maintenance"}>
        <Protected><Maintenance /></Protected>
      </Route>
      
      {/* Admin-only routes */}
      <Route path={"/users"}>
        <Protected requireAdmin><UserManagement /></Protected>
      </Route>
      
      {/* Fallback routes */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/*
 * DESIGN SYSTEM: Government Institutional Modernism
 * Light theme with Deep Navy primary, Amber accents
 * Professional, trustworthy government portal aesthetic
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
