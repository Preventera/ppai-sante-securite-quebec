
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import RiskRegistry from "./pages/RiskRegistry";
import ProgramGenerator from "./pages/ProgramGenerator";
import SectorGenerator from "./pages/SectorGenerator";
import PipelineGenerator from "./pages/PipelineGenerator";
import KPIGenerator from "./pages/KPIGenerator";
import Programs from "./pages/Programs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-4">
                <SidebarTrigger className="mb-4" />
              </div>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/risks" element={<RiskRegistry />} />
                <Route path="/generator" element={<ProgramGenerator />} />
                <Route path="/sector-generator" element={<SectorGenerator />} />
                <Route path="/pipeline-generator" element={<PipelineGenerator />} />
                <Route path="/kpi-generator" element={<KPIGenerator />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/measures" element={<div className="p-6"><h1 className="text-2xl font-bold text-sst-blue">Mesures préventives</h1><p className="text-gray-600 mt-2">Module en développement</p></div>} />
                <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold text-sst-blue">Rapports</h1><p className="text-gray-600 mt-2">Module en développement</p></div>} />
                <Route path="/calendar" element={<div className="p-6"><h1 className="text-2xl font-bold text-sst-blue">Calendrier</h1><p className="text-gray-600 mt-2">Module en développement</p></div>} />
                <Route path="/users" element={<div className="p-6"><h1 className="text-2xl font-bold text-sst-blue">Utilisateurs</h1><p className="text-gray-600 mt-2">Module en développement</p></div>} />
                <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold text-sst-blue">Paramètres</h1><p className="text-gray-600 mt-2">Module en développement</p></div>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
