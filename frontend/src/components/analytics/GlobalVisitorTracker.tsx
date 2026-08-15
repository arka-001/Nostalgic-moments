"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendHeartbeat } from "@/lib/api";

/**
 * Global Visitor Session & GeoIP Presence Tracker
 * Runs on every client page, capturing real-time visitor activity,
 * route transitions, and periodic presence heartbeats for the Admin Radar & World Map.
 */
export default function GlobalVisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // ExperienceClient manages its own detailed track and playback heartbeats
    if (pathname.startsWith("/experience/")) {
      return;
    }

    let envName = "General Browsing";
    if (pathname === "/") {
      envName = "Homepage & Experience Showcase";
    } else if (pathname.startsWith("/admin")) {
      envName = "Admin Workspace";
    }

    sendHeartbeat({
      current_path: pathname,
      current_environment: envName,
      is_playing: false,
      duration_increment: 0,
    });

    lastPathRef.current = pathname;

    // Send periodic presence ping every 25 seconds
    const interval = setInterval(() => {
      sendHeartbeat({
        current_path: pathname,
        current_environment: envName,
        is_playing: false,
        duration_increment: 0,
      });
    }, 25000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
