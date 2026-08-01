import { useState } from "react";
import { Home, Shield, FileText, BarChart3, Settings, AlertTriangle, Users, Calendar, Wand2, Building, Workflow, Calculator, LogOut, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: Home,
  },
  {
    title: "Registre des risques",
    url: "/risks",
    icon: AlertTriangle,
  },
  {
    title: "Générateur CNESST",
    url: "/generator",
    icon: Wand2,
  },
  {
    title: "Générateur par Secteur",
    url: "/sector-generator",
    icon: Building,
  },
  {
    title: "Pipeline Générateur PPAI",
    url: "/pipeline-generator",
    icon: Workflow,
  },
  {
    title: "Générateur KPI & Mapping",
    url: "/kpi-generator",
    icon: Calculator,
  },
  {
    title: "Programmes SST",
    url: "/programs",
    icon: Shield,
  },
  {
    title: "Mesures préventives",
    url: "/measures",
    icon: FileText,
  },
  {
    title: "Rapports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Calendrier",
    url: "/calendar",
    icon: Calendar,
  },
];

const adminItems = [
  {
    title: "Utilisateurs",
    url: "/users",
    icon: Users,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, profile, user, demoMode, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Sidebar className="border-r border-border bg-white">
      <SidebarHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sst-blue rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sst-blue">PPAI</h1>
            <p className="text-xs text-gray-500">Prevention Program AI</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium text-xs uppercase tracking-wide mb-3">
            Navigation principale
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                      location.pathname === item.url && "bg-sst-blue text-white hover:bg-sst-blue/90"
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-gray-500 font-medium text-xs uppercase tracking-wide mb-3">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                      location.pathname === item.url && "bg-sst-blue text-white hover:bg-sst-blue/90"
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-6 py-4 border-t border-border space-y-3">
        {/* Organisation courante et déconnexion, masquées en démonstration */}
        {!demoMode && organization && (
          <div className="space-y-2">
            <div className="text-xs">
              <p className="font-medium text-gray-700 truncate" title={organization.name}>
                {organization.name}
              </p>
              <p className="text-gray-500 truncate" title={user?.email ?? ''}>
                {profile?.full_name || user?.email}
              </p>
            </div>
            {/* Changer son mot de passe sans passer par « mot de passe oublié » :
                le même écran sert les deux cas. */}
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link to="/auth/reset">
                <KeyRound className="w-4 h-4 mr-2" />
                Changer mon mot de passe
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        )}
        <div className="text-xs text-gray-500">
          <p>Conforme CNESST</p>
          <p>Version 1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
