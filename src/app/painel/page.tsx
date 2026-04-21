import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { CorredoresManager } from "@/components/corredores-manager";
import { Separator } from "@/components/ui/separator";
import { Shield, LogOut, ArrowLeft } from "lucide-react";

export default async function PainelPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/painel/login");
  }

  const { env } = await import("@/lib/env");
  const admins = env.ADMIN_USERS.split(",").map((e: string) => e.trim().toLowerCase());
  const emailGithub = session.user.email?.toLowerCase() || "";
  const usernameGithub = session.user.username?.toLowerCase() || "";
  const isAdmin = admins.includes(emailGithub) || admins.includes(usernameGithub);

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-destructive/10 text-destructive p-6 sm:p-8 rounded-xl text-center space-y-5 shadow-sm border border-destructive/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
            <Shield className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Acesso Restrito</h2>
            <p className="text-sm text-destructive/90">
              Seu perfil do GitHub não tem permissão para acessar o CMS.
            </p>
          </div>

          <div className="bg-background/80 text-foreground p-4 rounded-lg text-left text-xs space-y-1.5 font-mono break-all border">
            <p>
              <strong className="font-semibold">Seu Email Github:</strong>{" "}
              {session.user.email ?? "null / privado"}
            </p>
            <p>
              <strong className="font-semibold">Permissão (.env):</strong> {env.ADMIN_USERS}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/painel/login" });
            }}
            className="pt-2"
          >
            <Button type="submit" variant="destructive" className="w-full font-semibold">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-none truncate">
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Runking</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao site
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground sm:hidden"
              aria-label="Voltar ao site"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <Separator orientation="vertical" className="h-6 mx-0.5" />

            <ModeToggle />

            <Separator orientation="vertical" className="h-6 mx-0.5" />

            <div className="flex items-center gap-2 px-1">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
                <AvatarFallback className="text-xs font-semibold">
                  {session.user.name?.charAt(0).toUpperCase() ?? "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline max-w-[140px] truncate">
                {session.user.name}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/painel/login" });
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                type="submit"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <CorredoresManager />
      </div>
    </main>
  );
}
