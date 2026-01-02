"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useModeAnimation, ThemeAnimationType } from "react-theme-switch-animation";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    isDarkMode: resolvedTheme === "dark",
    onDarkModeChange: (isDark) => setTheme(isDark ? "dark" : "light"),
  });

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className="h-10 w-10 cursor-pointer shrink-0"
      onClick={toggleSwitchTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
