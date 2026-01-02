"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function YearSelect({
  currentYear,
  className,
}: {
  currentYear: number;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => thisYear - i);

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year.toString());
    setOpen(false);
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("gap-2 font-bold h-10 cursor-pointer", className)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {currentYear}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {years.map((year) => (
            <DropdownMenuItem
              key={year}
              onClick={() => handleYearChange(year)}
              className={year === currentYear ? "bg-accent cursor-pointer" : "cursor-pointer"}
            >
              {year}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className={cn("gap-2 font-bold h-10", className)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          {currentYear}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Selecione o Ano</DrawerTitle>
            <DrawerDescription>Escolha o ano para visualizar o ranking.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "outline"}
                className="w-full justify-start text-lg h-12 cursor-pointer"
                onClick={() => handleYearChange(year)}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {year}
              </Button>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
