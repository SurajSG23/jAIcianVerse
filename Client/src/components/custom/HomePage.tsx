"use client";
import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import { cn } from "../../../lib/utils";
import { IoExitOutline } from "react-icons/io5";
import { Home, MessagesSquare, NotebookPen, User2 } from "lucide-react";
import Dashboard from "./Dashboard";
import { Link } from "react-router-dom";
const HomePage = () => {
  const links = [
    {
      label: "Home",
      href: "#",
      icon: (
        <Home className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <User2 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Messages",
      href: "#",
      icon: (
        <MessagesSquare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Materials",
      href: "#",
      icon: (
        <NotebookPen className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 group">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* --- Profile + Logout --- */}
          <div className="flex flex-col items-start">
            <SidebarLink
              link={{
                label: "Suraj S G",
                href: "#",
                icon: (
                  <img
                    src="suraj.jpg"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />

            <Link
              to="/"
              className={cn(
                "text-red-600 text-sm cursor-pointer transition-opacity duration-300 flex items-center gap-1 hover:text-red-500",
                open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              Logout
              <IoExitOutline />
            </Link>
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
};
export const Logo = () => {
  return (
    <Link
      to="/homepage"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        <p className="text-xl font-bold tracking-tight">
          j<span className="text-orange-400">AI</span>cian
          <span className="text-orange-400">Verse</span>
        </p>
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black mt-2"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

// Dummy dashboard component with content

export default HomePage;
