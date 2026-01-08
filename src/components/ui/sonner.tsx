"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-background group-[.toaster]:!text-white group-[.toaster]:!border-border group-[.toaster]:!shadow-lg data-[type=error]:!bg-destructive data-[type=error]:!text-destructive-foreground data-[type=error]:!border-destructive data-[type=success]:!bg-green-600 data-[type=success]:!text-white data-[type=success]:!border-green-700 font-bold",
          description: "group-[.toast]:!text-white",
          actionButton: "group-[.toast]:!bg-green-200 group-[.toast]:!text-white",
          cancelButton: "group-[.toast]:!bg-green-200 group-[.toast]:!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
