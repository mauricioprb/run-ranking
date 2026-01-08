import { ServicoAutenticacao } from "@/core/services/auth";
import { StravaGateway } from "@/infra/strava/gateway";
import { createClient } from "@supabase/supabase-js";

export class ServicoSincronizacao {
  private stravaGateway: StravaGateway;
  private authService: ServicoAutenticacao;
  private supabaseAdmin;

  constructor() {
    this.stravaGateway = new StravaGateway();
    this.authService = new ServicoAutenticacao();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida");
    }

    this.supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async sincronizarTudo() {
    const { data: corredores, error } = await this.supabaseAdmin
      .from("corredores")
      .select("*")
      .eq("esta_ativo", true);

    if (error) {
      throw new Error(`Erro ao buscar corredores: ${error.message}`);
    }

    if (!corredores || corredores.length === 0) {
      return {
        mensagem: "Nenhum corredor ativo para sincronizar",
        total: 0,
        sucessos: 0,
        falhas: 0,
      };
    }

    const resultados = await Promise.allSettled(
      corredores.map((corredor) => this.sincronizarCorredor(corredor)),
    );

    const sucessos = resultados.filter((r) => r.status === "fulfilled").length;
    const falhas = resultados.filter((r) => r.status === "rejected").length;

    return {
      mensagem: "Sincronização concluída",
      total: corredores.length,
      sucessos,
      falhas,
      detalhes: resultados.map((r, i) => ({
        corredor: corredores[i].nome,
        status: r.status,
        erro: r.status === "rejected" ? String(r.reason) : null,
      })),
    };
  }

  public async sincronizarCorredor(corredor: { strava_id: number }) {
    try {
      const tokenAcesso = await this.authService.garantirTokenValido(corredor.strava_id);

      const agora = new Date();
      const inicioDoAno = new Date(agora.getFullYear() - 5, 0, 1);
      const timestampInicioAno = Math.floor(inicioDoAno.getTime() / 1000);

      const atividades = await this.stravaGateway.buscarAtividades(tokenAcesso, timestampInicioAno);

      const corridas = atividades.filter((a) => a.type === "Run");

      if (corridas) {
        const { data: atividadesLocais } = await this.supabaseAdmin
          .from("atividades")
          .select("id")
          .eq("corredor_id", corredor.strava_id)
          .gte("data_inicio", inicioDoAno.toISOString());

        if (atividadesLocais) {
          const idsStrava = new Set(corridas.map((c) => c.id));
          const idsParaRemover = atividadesLocais
            .map((a) => a.id)
            .filter((id) => !idsStrava.has(id));

          if (idsParaRemover.length > 0) {
            console.log(
              `Removendo ${idsParaRemover.length} atividades excluídas para o corredor ${corredor.strava_id}`,
            );
            await this.supabaseAdmin.from("atividades").delete().in("id", idsParaRemover);
          }
        }
      }

      if (corridas.length === 0) {
        return;
      }

      const dadosUpsert = corridas.map((a) => ({
        id: a.id,
        corredor_id: corredor.strava_id,
        distancia: a.distance,
        tempo: a.moving_time,
        data_inicio: a.start_date,
        tipo: a.type,
      }));

      const { error } = await this.supabaseAdmin.from("atividades").upsert(dadosUpsert);

      if (error) {
        throw new Error(`Erro ao salvar atividades: ${error.message}`);
      }
    } catch (erro) {
      console.error(`Erro ao sincronizar corredor ${corredor.strava_id}:`, erro);
      throw erro;
    }
  }
}
