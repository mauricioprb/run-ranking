import { criarClienteSupabase } from "@/infra/supabase/server";

export type Atividade = {
  distancia: number;
  data_inicio: string;
};

export type Corredor = {
  strava_id: number;
  nome: string;
  url_avatar: string | null;
  atividades: Atividade[];
};

export type RankingItem = Corredor & {
  distanciaTotalKm: number;
};

export async function getRankingData(year: number, startDate?: string, endDate?: string): Promise<RankingItem[]> {
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
    return [];
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  const ranking = (corredoresRaw as unknown as Corredor[])
    .map((corredor) => {
      const atividadesFiltradas = corredor.atividades.filter((curr) => {
        const dataAtividade = new Date(curr.data_inicio);

        if (start && end) {
          return dataAtividade >= start && dataAtividade <= end;
        }

        const anoAtividade = dataAtividade.getUTCFullYear();
        return anoAtividade === year;
      });

      const distanciaTotalMetros = atividadesFiltradas.reduce((acc, curr) => {
        return acc + curr.distancia;
      }, 0);

      return {
        ...corredor,
        atividades: atividadesFiltradas,
        distanciaTotalKm: distanciaTotalMetros / 1000,
      };
    })
    .sort((a, b) => b.distanciaTotalKm - a.distanciaTotalKm);

  return ranking;
}
