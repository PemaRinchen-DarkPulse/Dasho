import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { getUser, getToken, clearAuth } from "@/lib/api";

const NavBar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = Boolean(getToken() && user);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-md flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <Link to="/" className="text-xl font-bold text-foreground">FabLab Manager</Link>
          </div>
          <div className="hidden md:flex items-center justify-center space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/equipment"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
              }
            >
              Equipment
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
              }
            >
              Bookings
            </NavLink>
            <NavLink
              to="/maintenance"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
              }
            >
              Maintenance
            </NavLink>
            {isLoggedIn && isAdmin && (
              <NavLink
                to="/admin-dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
                }
              >
                Admin
              </NavLink>
            )}
            {isLoggedIn && !isAdmin && (
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-smooth whitespace-nowrap shrink-0 ${isActive ? "text-foreground font-semibold bg-accent/30" : "text-muted-foreground hover:text-foreground hover:bg-accent/20"}`
                }
              >
                My Booking
              </NavLink>
            )}
          </div>
          <div className="hidden md:flex justify-end items-center gap-2">
            {!isLoggedIn ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={{ pathname: "/login" }} state={{ intent: "login" }}>Log in</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
