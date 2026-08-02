import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthReset from "./pages/AuthReset";
import RiskRegistry from "./pages/RiskRegistry";
import ProgramGenerator from "./pages/ProgramGenerator";
import SectorGenerator from "./pages/SectorGenerator";
import PipelineGenerator from "./pages/PipelineGenerator";
import KPIGenerator from "./pages/KPIGenerator";
import Programs from "./pages/Programs";
import Participation from "./pages/Participation";
import Users from "./pages/Users";
import Generer from "./pages/Generer";
import Signaler from "./pages/Signaler";
import Signalements from "./pages/Signalements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            {/* Seules routes accessibles sans session.
                `/auth/reset` reçoit le lien de réinitialisation : la placer
                derrière RequireAuth la rendrait inatteignable au moment précis
                où l'utilisateur n'a plus de mot de passe. */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset" element={<AuthReset />} />

            <Route path="/" element={<AppShell><Index /></AppShell>} />
            <Route path="/risks" element={<AppShell><RiskRegistry /></AppShell>} />
            <Route path="/generator" element={<AppShell><ProgramGenerator /></AppShell>} />
            <Route path="/sector-generator" element={<AppShell><SectorGenerator /></AppShell>} />
            <Route path="/pipeline-generator" element={<AppShell><PipelineGenerator /></AppShell>} />
            <Route path="/kpi-generator" element={<AppShell><KPIGenerator /></AppShell>} />
            <Route path="/programs" element={<AppShell><Programs /></AppShell>} />
            <Route path="/generer" element={<AppShell><Generer /></AppShell>} />
            <Route path="/signaler" element={<AppShell><Signaler /></AppShell>} />
            <Route path="/signalements" element={<AppShell><RequireRole roles={["admin", "preventionniste"]}><Signalements /></RequireRole></AppShell>} />
            <Route path="/participation" element={<AppShell><Participation /></AppShell>} />
            {/* La gestion des comptes engage l'organisation : seule la
                direction y accède. La base l'impose de toute façon
                (migration 005) — la garde évite un écran où tout échouerait. */}
            <Route path="/users" element={<AppShell><RequireRole roles={["admin"]}><Users /></RequireRole></AppShell>} />
            {/* Les routes « module en développement » restantes (mesures,
                rapports, calendrier, paramètres) ont été retirées : une
                navigation est une promesse, chaque entrée doit tenir la sienne.
                Elles reviendront quand les écrans existeront réellement. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
