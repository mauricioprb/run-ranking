"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateRangeFilter({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const yearParam = searchParams.get("year");
  const currentYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const prevYearRef = React.useRef(currentYear);

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (startDateParam && endDateParam) {
      return {
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      };
    }
    return undefined;
  });

  React.useEffect(() => {
    if (prevYearRef.current !== currentYear) {
      prevYearRef.current = currentYear;
      if (date?.from && date.from.getFullYear() !== currentYear) {
        setDate(undefined);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("startDate");
        params.delete("endDate");
        router.push(`/?${params.toString()}`);
      }
    }
  }, [currentYear, date, router, searchParams]);

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);

    if (newDate?.from && newDate?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("startDate", newDate.from.toISOString());
      params.set("endDate", newDate.to.toISOString());

      if (newDate.from.getFullYear() !== currentYear) {
        params.set("year", newDate.from.getFullYear().toString());
      }

      router.push(`/?${params.toString()}`);
    } else if (!newDate) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("startDate");
      params.delete("endDate");
      router.push(`/?${params.toString()}`);
    }
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "gap-2 font-bold h-10 w-full justify-start text-left cursor-pointer",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/y", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/y", { locale: ptBR })
              )
            ) : (
              <span>Filtrar por período</span>
            )}
            {date && (
              <div
                role="button"
                onClick={clearFilter}
                className="ml-auto hover:bg-accent rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date(currentYear, 0, 1)}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
            disabled={(date) => date.getFullYear() !== currentYear}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
