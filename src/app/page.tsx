import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { YearSelect } from "@/components/year-select";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { RankingList } from "@/components/ranking-list";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const yearParam = params.year;
  const anoSelecionado = yearParam ? parseInt(yearParam) : new Date().getFullYear();
  const startDate = params.startDate;
  const endDate = params.endDate;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Runking</h1>
              <p className="text-muted-foreground">
                Classificação anual de 01/01/{anoSelecionado} a 31/12/{anoSelecionado}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <Button
              asChild
              className="flex-1 border-none font-bold hover:opacity-90 transition-opacity h-10 px-6 [&_svg]:size-auto! [&_svg]:h-3! [&_svg]:w-auto! md:flex-none"
              style={{ backgroundColor: "#FC5200", color: "#FFFFFF" }}
            >
              <Link href="/auth/login" className="flex items-center justify-center gap-1">
                <span className="text-xs uppercase font-bold">Conectar com o</span>
                <svg
                  viewBox="0 25 176 35"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-auto"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M93.6921 57.7137L93.6911 57.7123H102.972L108.673 46.2495L114.374 57.7123H125.651L108.672 24.9302L92.5543 56.0524L86.3661 47.0167C90.1869 45.1741 92.5685 41.9828 92.5685 37.3987V37.3085C92.5685 34.073 91.5802 31.7356 89.6922 29.8477C87.4897 27.6455 83.9392 26.2523 78.3664 26.2523H62.995V57.7137H73.5122V48.7246H75.7594L81.6921 57.7137H93.6921ZM158.547 24.9302L141.57 57.7123H152.848L158.549 46.2495L164.25 57.7123H175.527L158.547 24.9302ZM133.62 59.0022L150.597 26.22H139.32L133.619 37.6829L127.918 26.22H116.641L133.62 59.0022ZM78.0517 41.2191C80.5681 41.2191 82.0965 40.0956 82.0965 38.163V38.0728C82.0965 36.0504 80.5232 35.0617 78.0966 35.0617H73.5122V41.2191H78.0517ZM40.5035 35.1512H31.2454V26.2523H60.2792V35.1512H51.0211V57.7137H40.5035V35.1512ZM5.61851 46.2977L0 52.9945C4.00023 56.5007 9.75321 58.2981 16.135 58.2981C24.5849 58.2981 30.0233 54.2529 30.0233 47.6456V47.5561C30.0233 41.2189 24.6298 38.8815 16.5848 37.3988C13.2587 36.7689 12.4048 36.2303 12.4048 35.376V35.2861C12.4048 34.5221 13.1242 33.9828 14.6969 33.9828C17.6181 33.9828 21.1693 34.9266 24.1351 37.0838L29.2593 29.9829C25.6186 27.1063 21.1243 25.6678 15.0568 25.6678C6.38181 25.6678 1.70781 30.2975 1.70781 36.2749V36.3651C1.70781 43.0166 7.91057 45.0397 14.9665 46.4771C18.3376 47.1516 19.3259 47.6456 19.3259 48.5448V48.6351C19.3259 49.4886 18.5173 49.9826 16.6294 49.9826C12.9441 49.9826 9.03413 48.9047 5.61851 46.2977Z"
                  />
                </svg>
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Classificação Geral</CardTitle>
              <CardDescription>Ordenado pela distância total percorrida.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center">
              <DateRangeFilter className="w-full md:w-65" />
              <YearSelect currentYear={anoSelecionado} className="w-full md:w-auto" />
            </div>
          </CardHeader>
          <CardContent>
            <RankingList year={anoSelecionado} startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
