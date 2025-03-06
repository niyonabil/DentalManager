import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Calendar,
  FileText,
  Home,
  LogOut,
  Users,
  Timer,
  Pill,
  ActivitySquare,
  BarChart,
  Loader2,
  Settings,
  DollarSignIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationConfig = {
  secretary: [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/waiting-room", label: "Salle d'attente", icon: Timer },
    { href: "/payments", label: "Payements Patients", icon: DollarSignIcon },
  ],
  dentist: [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/treatments", label: "Traitements", icon: ActivitySquare },
    { href: "/medications", label: "Médicaments", icon: Pill },
    { href: "/waiting-room", label: "Salle d'attente", icon: Timer },
    { href: "/payments", label: "Payements Patients", icon: DollarSignIcon },
    { href: "/billing", label: "Documents", icon: FileText },
    { href: "/stats", label: "Statistiques", icon: BarChart },
  ],
  admin: [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/treatments", label: "Traitements", icon: ActivitySquare },
    { href: "/medications", label: "Médicaments", icon: Pill },
    { href: "/billing", label: "Documents", icon: FileText },
    { href: "/waiting-room", label: "Salle d'attente", icon: Timer },
    { href: "/payments", label: "Payements Patients", icon: DollarSignIcon },
    { href: "/stats", label: "Statistiques", icon: BarChart },
    { href: "/settings", label: "Paramètres", icon: Settings },
  ],
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Get navigation items based on user role
  const navigationItems = user ? navigationConfig[user.role as keyof typeof navigationConfig] : [];

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="text-xl font-bold mb-8 text-center">Cabinet Dentaire</div>

      <nav className="space-y-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 w-full text-left",
                  location === item.href && "bg-gray-100 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t">
        <div className="mb-4 px-4">
          <div className="font-medium">{user?.username}</div>
          <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}