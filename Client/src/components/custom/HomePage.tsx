"use client";
import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import { cn } from "../../../lib/utils";
import { IoExitOutline } from "react-icons/io5";
import { Home, MessagesSquare, NotebookPen, User2 } from "lucide-react";
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
        "mx-auto flex w-full flex-1 flex-col overflow-hidden border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 h-screen"
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
const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-l-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Welcome to the Dashboard
        </h1>
        <p className="text-neutral-700 dark:text-neutral-300">
          This is your main content area. You can add charts, tables, and other
          components here to build your dashboard. Lorem, ipsum dolor sit amet
          consectetur adipisicing elit. Cum reiciendis quam possimus, maiores
          neque nulla modi aliquid aut pariatur placeat provident quod a
          officiis repudiandae repellat consequuntur, itaque porro! Iste? Lorem
          ipsum dolor sit amet consectetur, adipisicing elit. Repudiandae
          praesentium numquam cumque dicta veniam! Aspernatur fuga dolore ullam
          aliquid libero quod repellat at. Officia accusantium quam error
          commodi vero voluptates praesentium dolore assumenda consequuntur quis
          distinctio voluptas, nostrum, placeat veritatis reiciendis iste
          repellat nulla eligendi illum corrupti quos veniam? Ratione nobis
          maiores suscipit laudantium aliquid voluptatem sequi quibusdam soluta
          exercitationem voluptas asperiores harum omnis ea itaque saepe fuga
          aliquam a ex, aperiam dolorum hic tenetur? Aspernatur molestiae
          laborum nobis maiores, quisquam provident dolorum distinctio pariatur!
          Maxime culpa autem dolores facilis quasi delectus dicta eveniet
          corrupti vel. Nulla minus molestias similique.
        </p>
      </div>
    </div>
  );
};
export default HomePage;
