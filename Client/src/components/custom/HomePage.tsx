import { cn } from "../../../lib/utils";
import Dashboard from "./Dashboard";
import Sidebar from "./Navbar";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

const HomePage = () => {
  const { checkUser } = useAuth();
  
  useEffect(() => {
    checkUser("homepage");
  }, []);

  return (
    <div
      className={cn(
        "mx-auto flex h-[100dvh] w-full flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-900"
      )}
    >
      <Sidebar />
      <Dashboard />
    </div>
  );
};

export default HomePage;
