import type { CorredorRepository } from "@/core/repositories/corredor.repository";
import { getISOWeek, getISOWeekYear } from "date-fns";

type Atividade = {
  distancia: number;
  tempo: number | null;
  data_inicio: Date;
};

export type RankingItem = {
  strava_id: number;
  nome: string;
  url_avatar: string | null;
  atividades: Atividade[];
  distanciaTotalKm: number;
  melhorPace: string;
  melhorPaceSegundos: number;
};

export class ServicoRanking {
  constructor(private corredorRepo: CorredorRepository) {}

  async getRankingData(
    year: number,
    startDate?: string,
    endDate?: string,
    limitActivities: boolean = false,
  ): Promise<RankingItem[]> {
    const corredores = await this.corredorRepo.listarAtivosComAtividades();

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    const ranking = corredores
      .map((corredor) => {
        let activitiesToFilter = corredor.atividades;

        if (limitActivities) {
          activitiesToFilter = this.limitarAtividadesSemanais(activitiesToFilter);
        }

        const atividadesFiltradas = activitiesToFilter.filter((curr) => {
          const dataAtividade = new Date(curr.data_inicio);

          if (start && end) {
            return dataAtividade >= start && dataAtividade <= end;
          }

          const anoAtividade = dataAtividade.getUTCFullYear();
          return anoAtividade === year;
        });

        const distanciaTotalMetros = atividadesFiltradas.reduce((acc, curr) => acc + curr.distancia, 0);

        let melhorPaceSegundos = Infinity;

        for (const atividade of atividadesFiltradas) {
          if (!atividade.tempo || atividade.distancia < 100) continue;
          const paceSegundosPorKm = atividade.tempo / (atividade.distancia / 1000);
          if (paceSegundosPorKm < melhorPaceSegundos) {
            melhorPaceSegundos = paceSegundosPorKm;
          }
        }

        if (melhorPaceSegundos === Infinity) melhorPaceSegundos = 0;

        const minutos = Math.floor(melhorPaceSegundos / 60);
        const segundos = Math.floor(melhorPaceSegundos % 60);
        const melhorPace =
          melhorPaceSegundos > 0 ? `${minutos}'${segundos.toString().padStart(2, "0")}"` : "-";

        return {
          strava_id: corredor.strava_id,
          nome: corredor.nome,
          url_avatar: corredor.url_avatar,
          atividades: atividadesFiltradas,
          distanciaTotalKm: distanciaTotalMetros / 1000,
          melhorPace,
          melhorPaceSegundos,
        };
      })
      .sort((a, b) => b.distanciaTotalKm - a.distanciaTotalKm);

    return ranking;
  }

  private limitarAtividadesSemanais(atividades: Atividade[]): Atividade[] {
    const activitiesByWeek = new Map<string, Atividade[]>();

    for (const activity of atividades) {
      const date = new Date(activity.data_inicio);
      const activityYear = getISOWeekYear(date);
      const activityWeek = getISOWeek(date);
      const key = `${activityYear}-${activityWeek}`;

      if (!activitiesByWeek.has(key)) {
        activitiesByWeek.set(key, []);
      }
      activitiesByWeek.get(key)!.push(activity);
    }

    const limitedActivities: Atividade[] = [];
    for (const activities of activitiesByWeek.values()) {
      if (activities.length <= 3) {
        limitedActivities.push(...activities);
      } else {
        const shuffled = [...activities].sort(() => 0.5 - Math.random());
        limitedActivities.push(...shuffled.slice(0, 3));
      }
    }

    return limitedActivities;
  }
}
