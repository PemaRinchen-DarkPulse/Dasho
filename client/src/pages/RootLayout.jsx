import { Outlet } from "react-router-dom";
import NavBar from "@/components/NavBar";

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default RootLayout;
