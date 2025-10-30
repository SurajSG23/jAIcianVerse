import { cn } from "../../../lib/utils";
import Dashboard from "./Dashboard";
import Sidebar from "./Navbar";
const HomePage = () => {
  return (
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-900 h-screen"
      )}
    >
      <Sidebar />
      <Dashboard />
    </div>
  );
};

export default HomePage;
