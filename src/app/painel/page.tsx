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
        <div className="max-w-md w-full bg-destructive/10 text-destructive text-sm p-6 rounded-md font-medium text-center space-y-4 shadow-sm border border-destructive/20">
          <Shield className="h-10 w-10 mx-auto text-destructive opacity-80" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
          <p>Seu perfil do GitHub não tem permissão para acessar o CMS.</p>

          <div className="bg-background/80 text-foreground p-3 rounded text-left text-xs space-y-1 mt-4 font-mono break-all border">
            <p>
              <strong>Seu Email Github:</strong> {session.user.email ?? "null / privado"}
            </p>
            <p>
              <strong>Permissão (.env):</strong> {env.ADMIN_USERS}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/painel/login" });
            }}
            className="pt-4"
          >
            <Button type="submit" variant="destructive" className="w-full font-semibold">
              <LogOut className="h-4 w-4 mr-2" /> Sair
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
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Painel Admin</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Runking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar ao site
              </Link>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <ModeToggle />

            <div className="flex items-center gap-2 ml-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
                <AvatarFallback className="text-xs">
                  {session.user.name?.charAt(0).toUpperCase() ?? "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{session.user.name}</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/painel/login" });
              }}
            >
              <Button variant="ghost" size="icon" className="text-muted-foreground" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <CorredoresManager />
      </div>
    </main>
  );
}
