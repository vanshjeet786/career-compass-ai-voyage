import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  LayoutDashboard,
  User,
  LogOut,
  Compass,
  Menu,
  X,
  Plus,
  ChevronDown,
  FileText,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  if (location.pathname === "/auth") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Dashboard", path: "/profile", icon: LayoutDashboard },
    { label: "Results", path: "/results", icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Compass className="h-5 w-5" />
          <span className="hidden sm:inline">Career Compass</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 text-sm ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right side: CTA + Avatar */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={async () => {
              // Abandon old in-progress assessments, then go to background info for a fresh start
              await supabase
                .from("assessments")
                .update({ status: "abandoned" })
                .eq("user_id", user.id)
                .eq("status", "in_progress");
              navigate("/background-info");
            }}
            className="hidden sm:inline-flex gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Assessment
          </Button>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/results")}>
                <FileText className="h-4 w-4 mr-2" />
                Latest Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/background-info")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Background Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-3 space-y-1 animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              navigate("/assessment");
              setMobileOpen(false);
            }}
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </div>
      )}
    </nav>
  );
};
