import { criarClienteSupabase } from "@/infra/supabase/server";
import { getISOWeek, getISOWeekYear } from "date-fns";

export type Atividade = {
  distancia: number;
  tempo: number;
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
  melhorPace: string; // "MM:SS"
  melhorPaceSegundos: number;
};

export async function getRankingData(
  year: number,
  startDate?: string,
  endDate?: string,
  limitActivities: boolean = false,
): Promise<RankingItem[]> {
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
        tempo,
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
      let activitiesToFilter = corredor.atividades;

      if (limitActivities) {
        const activitiesByWeek = new Map<string, Atividade[]>();

        activitiesToFilter.forEach((activity) => {
          const date = new Date(activity.data_inicio);
          const activityYear = getISOWeekYear(date);
          const activityWeek = getISOWeek(date);
          const key = `${activityYear}-${activityWeek}`;

          if (!activitiesByWeek.has(key)) {
            activitiesByWeek.set(key, []);
          }
          activitiesByWeek.get(key)!.push(activity);
        });

        const limitedActivities: Atividade[] = [];
        activitiesByWeek.forEach((activities) => {
          if (activities.length <= 3) {
            limitedActivities.push(...activities);
          } else {
            const shuffled = [...activities].sort(() => 0.5 - Math.random());
            limitedActivities.push(...shuffled.slice(0, 3));
          }
        });
        activitiesToFilter = limitedActivities;
      }

      const atividadesFiltradas = activitiesToFilter.filter((curr) => {
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

      let melhorPaceSegundos = Infinity;

      atividadesFiltradas.forEach((atividade) => {
        if (!atividade.tempo || atividade.distancia < 100) return;

        const paceSegundosPorKm = atividade.tempo / (atividade.distancia / 1000);

        if (paceSegundosPorKm < melhorPaceSegundos) {
          melhorPaceSegundos = paceSegundosPorKm;
        }
      });

      if (melhorPaceSegundos === Infinity) melhorPaceSegundos = 0;

      const minutos = Math.floor(melhorPaceSegundos / 60);
      const segundos = Math.floor(melhorPaceSegundos % 60);
      const melhorPace =
        melhorPaceSegundos > 0 ? `${minutos}'${segundos.toString().padStart(2, "0")}"` : "-";

      return {
        ...corredor,
        atividades: atividadesFiltradas,
        distanciaTotalKm: distanciaTotalMetros / 1000,
        melhorPace,
        melhorPaceSegundos,
      };
    })
    .sort((a, b) => b.distanciaTotalKm - a.distanciaTotalKm);

  return ranking;
}
