"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type Corredor = {
  strava_id: number;
  nome: string;
  url_avatar: string | null;
  esta_ativo: boolean | null;
};

export function CorredoresManager() {
  const [corredores, setCorredores] = useState<Corredor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isPending, startTransition] = useTransition();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [corredorSelecionado, setCorredorSelecionado] = useState<Corredor | null>(null);
  const [acaoSelecionada, setAcaoSelecionada] = useState<"aprovar" | "desativar">("aprovar");

  const carregarCorredores = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/corredores");
      if (!res.ok) throw new Error("Falha ao carregar corredores");
      const dados = await res.json();
      return dados as Corredor[];
    } catch {
      toast.error("Erro ao carregar a lista de corredores.");
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    carregarCorredores().then((dados) => {
      if (!cancelled && dados) {
        setCorredores(dados);
      }
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [carregarCorredores]);

  const abrirDialog = (corredor: Corredor, acao: "aprovar" | "desativar") => {
    setCorredorSelecionado(corredor);
    setAcaoSelecionada(acao);
    setDialogAberto(true);
  };

  const executarAcao = async () => {
    if (!corredorSelecionado) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/painel/corredores", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strava_id: corredorSelecionado.strava_id,
            esta_ativo: acaoSelecionada === "aprovar",
          }),
        });

        if (!res.ok) throw new Error("Falha na operação");

        setCorredores((prev) =>
          prev.map((c) =>
            c.strava_id === corredorSelecionado.strava_id
              ? { ...c, esta_ativo: acaoSelecionada === "aprovar" }
              : c,
          ),
        );

        toast.success(
          acaoSelecionada === "aprovar"
            ? `${corredorSelecionado.nome} foi aprovado com sucesso!`
            : `${corredorSelecionado.nome} foi desativado.`,
        );
      } catch {
        toast.error("Erro ao executar a ação. Tente novamente.");
      } finally {
        setDialogAberto(false);
        setCorredorSelecionado(null);
      }
    });
  };

  const corredoresFiltrados = corredores.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const pendentes = corredores.filter((c) => !c.esta_ativo);
  const ativos = corredores.filter((c) => c.esta_ativo);

  const getIniciais = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{loading ? "–" : corredores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{loading ? "–" : ativos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(252, 82, 0, 0.1)" }}
              >
                <Clock className="h-6 w-6" style={{ color: "#fc5200" }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{loading ? "–" : pendentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main table card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Corredores</CardTitle>
              <CardDescription>Gerencie o acesso dos corredores à plataforma.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar corredor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  setLoading(true);
                  const dados = await carregarCorredores();
                  if (dados) {
                    setCorredores(dados);
                  }
                  setLoading(false);
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : corredoresFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">
                {busca ? "Nenhum corredor encontrado." : "Nenhum corredor cadastrado ainda."}
              </p>
              {busca && (
                <p className="text-muted-foreground text-sm mt-1">Tente buscar com outro termo.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Corredor</TableHead>
                  <TableHead>Strava ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corredoresFiltrados.map((corredor) => (
                  <TableRow key={corredor.strava_id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-border">
                          <AvatarImage src={corredor.url_avatar ?? undefined} alt={corredor.nome} />
                          <AvatarFallback className="text-xs font-semibold bg-muted">
                            {getIniciais(corredor.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{corredor.nome}</p>
                          <a
                            href={`https://www.strava.com/athletes/${corredor.strava_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline mt-1 inline-block"
                          >
                            Ver no Strava ↗
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono">
                        {corredor.strava_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      {corredor.esta_ativo ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/15"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="gap-1 border-orange-500/20 hover:bg-orange-500/15"
                          style={{
                            backgroundColor: "rgba(252, 82, 0, 0.1)",
                            color: "#fc5200",
                          }}
                        >
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {corredor.esta_ativo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => abrirDialog(corredor, "desativar")}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 dark:text-green-400 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => abrirDialog(corredor, "aprovar")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Aprovar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoSelecionada === "aprovar" ? "Aprovar corredor" : "Desativar corredor"}
            </DialogTitle>
            <DialogDescription>
              {acaoSelecionada === "aprovar" ? (
                <>
                  Tem certeza que deseja aprovar <strong>{corredorSelecionado?.nome}</strong>? O
                  corredor passará a aparecer no ranking público.
                </>
              ) : (
                <>
                  Tem certeza que deseja desativar <strong>{corredorSelecionado?.nome}</strong>? O
                  corredor será removido do ranking público.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={executarAcao}
              disabled={isPending}
              variant={acaoSelecionada === "desativar" ? "destructive" : "default"}
              className={
                acaoSelecionada === "aprovar" ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : acaoSelecionada === "aprovar" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desativar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
