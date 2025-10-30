import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
const Messages = () => {
  return (
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-black h-screen text-white"
      )}
    >
      <Sidebar />
      <div>Messages </div>
    </div>
  );
};

export default Messages;
