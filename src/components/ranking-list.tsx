import { criarClienteSupabase } from "@/infra/supabase/server";
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
import { Trophy, Medal, Crown } from "lucide-react";

type Atividade = {
  distancia: number;
  data_inicio: string;
};

type Corredor = {
  strava_id: number;
  nome: string;
  url_avatar: string | null;
  atividades: Atividade[];
};

export async function RankingList({ year }: { year: number }) {
  const supabase = await criarClienteSupabase();

  const { data: corredoresRaw, error } = await supabase
    .from("corredores")
    .select(
      `
      strava_id,
      nome,
      url_avatar,
      atividades (
        distancia,
        data_inicio
      )
    `,
    )
    .eq("esta_ativo", true)
    .not("url_avatar", "is", null);

  if (error) {
    console.error("Erro ao buscar dados:", error);
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive">Erro ao carregar o ranking.</p>
      </div>
    );
  }

  const ranking = (corredoresRaw as unknown as Corredor[])
    .map((corredor) => {
      const distanciaTotalMetros = corredor.atividades.reduce((acc, curr) => {
        const dataAtividade = new Date(curr.data_inicio);
        const anoAtividade = dataAtividade.getUTCFullYear();
        
        if (anoAtividade === year) {
          return acc + curr.distancia;
        }
        return acc;
      }, 0);

      return {
        ...corredor,
        distanciaTotalKm: distanciaTotalMetros / 1000,
      };
    })
    .sort((a, b) => b.distanciaTotalKm - a.distanciaTotalKm);

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
          else if (posicao === 2)
            iconePosicao = <Medal className="h-5 w-5 text-gray-400" />;
          else if (posicao === 3)
            iconePosicao = <Medal className="h-5 w-5 text-amber-700" />;

          return (
            <TableRow key={atleta.strava_id}>
              <TableCell className="text-center font-medium p-2 sm:p-4">
                <div className="flex justify-center">
                  {iconePosicao || (
                    <span className="text-muted-foreground">#{posicao}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={atleta.url_avatar || ""} alt={atleta.nome} />
                    <AvatarFallback>
                      {atleta.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm sm:text-base truncate">
                      {atleta.nome}
                    </span>
                    {posicao <= 3 && (
                      <Badge
                        variant="secondary"
                        className="w-fit text-[10px] px-1 py-0 h-5"
                      >
                        Top {posicao}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-sm sm:text-base p-2 sm:p-4 whitespace-nowrap">
                {atleta.distanciaTotalKm.toFixed(1)} km
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
