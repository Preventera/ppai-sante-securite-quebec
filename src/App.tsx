import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RiskRegistry from "./pages/RiskRegistry";
import ProgramGenerator from "./pages/ProgramGenerator";
import SectorGenerator from "./pages/SectorGenerator";
import PipelineGenerator from "./pages/PipelineGenerator";
import KPIGenerator from "./pages/KPIGenerator";
import Programs from "./pages/Programs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const EnDeveloppement = ({ titre }: { titre: string }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-sst-blue">{titre}</h1>
    <p className="text-gray-600 mt-2">Module en développement</p>
  </div>
);

/** Coquille applicative : barre latérale et contenu, réservée aux sessions valides. */
const AppShell = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4">
            <SidebarTrigger className="mb-4" />
          </div>
          {/* Une page qui échoue ne doit pas emporter la navigation avec elle. */}
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </SidebarProvider>
  </RequireAuth>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Seule route accessible sans session */}
            <Route path="/auth" element={<Auth />} />

            <Route path="/" element={<AppShell><Index /></AppShell>} />
            <Route path="/risks" element={<AppShell><RiskRegistry /></AppShell>} />
            <Route path="/generator" element={<AppShell><ProgramGenerator /></AppShell>} />
            <Route path="/sector-generator" element={<AppShell><SectorGenerator /></AppShell>} />
            <Route path="/pipeline-generator" element={<AppShell><PipelineGenerator /></AppShell>} />
            <Route path="/kpi-generator" element={<AppShell><KPIGenerator /></AppShell>} />
            <Route path="/programs" element={<AppShell><Programs /></AppShell>} />
            <Route path="/measures" element={<AppShell><EnDeveloppement titre="Mesures préventives" /></AppShell>} />
            <Route path="/reports" element={<AppShell><EnDeveloppement titre="Rapports" /></AppShell>} />
            <Route path="/calendar" element={<AppShell><EnDeveloppement titre="Calendrier" /></AppShell>} />
            <Route path="/users" element={<AppShell><EnDeveloppement titre="Utilisateurs" /></AppShell>} />
            <Route path="/settings" element={<AppShell><EnDeveloppement titre="Paramètres" /></AppShell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
