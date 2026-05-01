"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
  createdAt?: string;
};

function formatOrdinal(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatAnnouncementDate(createdAt?: string) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  const day = formatOrdinal(date.getDate());
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = true,
  interval = 10000,
  showControls = true,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  interval?: number;
  showControls?: boolean;
}) => {
  const [active, setActive] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = testimonials.length;

  if (total === 0) {
    return (
      <div className="mx-auto w-auto px-4 py-2 font-sans antialiased md:px-8 lg:px-12">
        <div className="text-sm text-gray-500 dark:text-neutral-500">No testimonials available.</div>
      </div>
    );
  }

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + total) % total);
  }, [total]);

  const isActive = (index: number) => index === active;

  useEffect(() => {
    if (!autoplay || total === 0) return;

    autoplayRef.current = setInterval(next, interval);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoplay, interval, next, total]);

  const randomRotateY = () => Math.floor(Math.random() * 21) - 10;

  const activeDateLabel = formatAnnouncementDate(testimonials[active].createdAt);

  return (
    <div className="mx-auto w-auto px-4 py-2 font-sans antialiased md:px-8 lg:px-12">
      <div className="relative gap-20 md:grid-cols-2">
        <div className="flex flex-col justify-between py-4 h-75">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Avatar + Name */}
            <div className="flex gap-3">
              <div className="relative h-14 w-14">
                <AnimatePresence>
                  {testimonials.map((t, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.9, rotate: randomRotateY() }}
                      animate={{
                        opacity: isActive(index) ? 1 : 0.6,
                        scale: isActive(index) ? 1 : 0.92,
                        rotate: isActive(index) ? 0 : randomRotateY(),
                        zIndex: isActive(index) ? 40 : total - index,
                        y: isActive(index) ? [0, -30, 0] : 0,
                      }}
                      exit={{ scale: 0.9 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={t.src}
                        alt={t.name}
                        className="h-full w-full rounded-3xl object-cover"
                        draggable={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-black dark:text-white">
                  {testimonials[active].name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {/* {testimonials[active].designation} */}
                  {activeDateLabel ? `${activeDateLabel}` : ""}
                </p>
              </div>
            </div>

            {/* Quote */}
            <motion.p className="mt-4 text-lg text-gray-500 dark:text-neutral-300 h-40 overflow-y-auto">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ filter: "blur(8px)", opacity: 0, y: 6 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          {/* Controls */}
          {showControls && (
            <div className="flex gap-4 pt-10 mx-auto">
              <button
                onClick={prev}
                className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 cursor-pointer"
              >
                <IconArrowLeft className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
              </button>
              <button
                onClick={next}
                className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 cursor-pointer"
              >
                <IconArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
