import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PatientsPage from "@/pages/patients-page";
import AppointmentsPage from "@/pages/appointments-page";
import BillingPage from "@/pages/billing-page";
import WaitingRoomPage from "@/pages/waiting-room-page";
import PublicWaitingRoom from "@/pages/public-waiting-room";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/patients" component={PatientsPage} />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <ProtectedRoute path="/waiting-room" component={WaitingRoomPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/waiting-room/public" component={PublicWaitingRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;