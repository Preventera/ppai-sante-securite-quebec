import { Home, Shield, AlertTriangle, Wand2, LogOut, KeyRound, Users as UsersIcon, Handshake, Megaphone, Inbox } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { roleEffectif, peutAdministrer, LIBELLE_ROLE, type RoleApplicatif } from "@/lib/roles";
import { determinerMecanismes } from "@/lib/lmrsst";
import { secteurPourCode } from "@/lib/scianNiveaux";
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

/**
 * Navigation composée sur deux axes.
 *
 * Axe 1 — le rôle : chaque entrée déclare qui la voit. Un travailleur n'a que
 * faire de quatre générateurs dont chaque action lui serait refusée par la
 * base ; le comité consulte mais ne rédige pas.
 *
 * Axe 2 — l'assujettissement : l'entrée de participation se nomme
 * « Comité SST » ou « Agent de liaison » selon ce que `determinerMecanismes()`
 * conclut de l'effectif déclaré. On ne montre jamais un mécanisme auquel
 * l'établissement n'est pas assujetti.
 */
const TOUS: RoleApplicatif[] = ["admin", "preventionniste", "comite", "membre"];
const REDACTEURS: RoleApplicatif[] = ["admin", "preventionniste"];
const CONSULTATION: RoleApplicatif[] = ["admin", "preventionniste", "comite"];

/**
 * Adresses couvertes par l'entrée « Générer un document » : les quatre
 * parcours historiques restent accessibles, mais une seule entrée de menu
 * les représente — et reste allumée quand on navigue dans l'un d'eux.
 */
const ROUTES_GENERATION = [
  "/generer", "/generator", "/sector-generator", "/pipeline-generator", "/kpi-generator",
];

const navigationItems = [
  { title: "Tableau de bord", url: "/", icon: Home, roles: TOUS },
  { title: "Signaler un risque", url: "/signaler", icon: Megaphone, roles: TOUS },
  { title: "Registre des risques", url: "/risks", icon: AlertTriangle, roles: CONSULTATION },
  { title: "Signalements", url: "/signalements", icon: Inbox, roles: REDACTEURS },
  { title: "Générer un document", url: "/generer", icon: Wand2, roles: REDACTEURS },
  { title: "Programmes SST", url: "/programs", icon: Shield, roles: TOUS },
];

/**
 * Libellé de l'entrée de participation selon la situation de l'établissement.
 *
 * Effectif inconnu : libellé neutre — la page sert alors à le déclarer.
 */
function libelleParticipation(effectif: number | null | undefined, scian: string | null | undefined): string {
  if (!effectif || effectif <= 0) return "Participation SST";
  const mecanismes = determinerMecanismes({
    effectif,
    niveauRisque: secteurPourCode(scian)?.niveau,
  });
  return mecanismes.participation.comiteSanteSecurite ? "Comité SST" : "Agent de liaison";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, profile, user, demoMode, signOut } = useAuth();

  const role = roleEffectif(profile?.role, demoMode);
  const entrees = navigationItems.filter((item) => item.roles.includes(role));
  const entreeParticipation = {
    title: libelleParticipation(organization?.employee_count, organization?.scian_code),
    url: "/participation",
    icon: Handshake,
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Sidebar className="border-r border-border bg-white">
      <SidebarHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/agenticx5.svg" alt="AgenticX5" className="w-10 h-10" />
          <div>
            <h1 className="font-bold text-lg text-sst-blue">PPAI</h1>
            <p className="text-xs text-gray-500">par AgenticX5</p>
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
              {[...entrees, entreeParticipation].map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                      (item.url === "/generer"
                        ? ROUTES_GENERATION.includes(location.pathname)
                        : location.pathname === item.url) &&
                        "bg-sst-blue text-white hover:bg-sst-blue/90"
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

        {peutAdministrer(role) && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-gray-500 font-medium text-xs uppercase tracking-wide mb-3">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                      location.pathname === "/users" && "bg-sst-blue text-white hover:bg-sst-blue/90"
                    )}
                  >
                    <Link to="/users" className="flex items-center gap-3">
                      <UsersIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Utilisateurs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
              <p className="text-gray-400">{LIBELLE_ROLE[role]}</p>
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
          <p>© 2026 Preventera · AgenticX5 — Tous droits réservés</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
