import { getRankingData } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Medal, Crown } from "lucide-react";

export async function RankingList({
  year,
  startDate,
  endDate,
}: {
  year: number;
  startDate?: string;
  endDate?: string;
}) {
  const ranking = await getRankingData(year, startDate, endDate);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">Pos.</TableHead>
          <TableHead>Atleta</TableHead>
          <TableHead className="text-right">
            <span className="hidden sm:inline">Distância Total</span>
            <span className="sm:hidden">Dist.</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranking.map((atleta, index) => {
          const posicao = index + 1;
          let iconePosicao = null;

          if (posicao === 1) iconePosicao = <Crown className="h-5 w-5 text-yellow-500" />;
          else if (posicao === 2) iconePosicao = <Medal className="h-5 w-5 text-gray-400" />;
          else if (posicao === 3) iconePosicao = <Medal className="h-5 w-5 text-amber-700" />;

          let badgeColorClass = "";
          if (posicao === 1)
            badgeColorClass =
              "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25";
          else if (posicao === 2)
            badgeColorClass =
              "bg-slate-400/15 text-slate-600 dark:text-slate-400 hover:bg-slate-400/25";
          else if (posicao === 3)
            badgeColorClass =
              "bg-amber-700/15 text-amber-700 dark:text-amber-500 hover:bg-amber-700/25";

          return (
            <TableRow key={atleta.strava_id}>
              <TableCell className="text-center font-medium p-2 sm:p-4">
                <div className="flex justify-center">
                  {iconePosicao || <span className="text-muted-foreground">#{posicao}</span>}
                </div>
              </TableCell>
              <TableCell className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={atleta.url_avatar || ""} alt={atleta.nome} />
                    <AvatarFallback>{atleta.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm sm:text-base truncate">{atleta.nome}</span>
                    {posicao <= 3 && (
                      <Badge
                        variant="secondary"
                        className={cn("w-fit text-[10px] px-1 py-0 h-5", badgeColorClass)}
                      >
                        Top {posicao}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-sm sm:text-base p-2 sm:p-4 whitespace-nowrap">
                {atleta.distanciaTotalKm.toFixed(1)}km
              </TableCell>
            </TableRow>
          );
        })}

        {ranking.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              Nenhum dado de corrida encontrado para {year}.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
