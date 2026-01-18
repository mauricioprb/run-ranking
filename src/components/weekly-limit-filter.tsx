"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function WeeklyLimitFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const isChecked = searchParams.get("limited") === "true";

  const handleCheckedChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("limited", "true");
    } else {
      params.delete("limited");
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <div className="grid gap-2">
      <Button
        id="weekly-limit-button"
        variant="outline"
        asChild
        className={cn(
          "gap-2 font-bold h-10 w-full justify-start text-left hover:bg-accent",
          !isChecked && "text-muted-foreground",
        )}
      >
        <label htmlFor="weekly-limit" className="cursor-pointer flex items-center w-full">
          <Checkbox
            id="weekly-limit"
            checked={isChecked}
            onCheckedChange={handleCheckedChange}
            disabled={isPending}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
          />
          <span>Limitar 3 atividades/sem</span>
        </label>
      </Button>
    </div>
  );
}
