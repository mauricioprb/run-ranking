import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Shield } from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default async function PainelLogin() {
  const session = await auth();
  let isAdmin = false;

  if (session?.user) {
    const { env } = await import("@/lib/env");
    const admins = env.ADMIN_USERS.split(",").map((e: string) => e.trim().toLowerCase());
    const emailGithub = session.user.email?.toLowerCase() || "";
    const usernameGithub = session.user.username?.toLowerCase() || "";

    isAdmin = admins.includes(emailGithub) || admins.includes(usernameGithub);

    if (isAdmin) {
      redirect("/painel");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Painel Admin</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Faça login com o GitHub para acessar o painel de gerenciamento do Runking.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {session?.user && !isAdmin ? (
            <div className="space-y-4">
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg font-medium text-center space-y-3 border border-destructive/20">
                <p className="text-sm">Acesso negado.</p>
                <div className="text-xs font-mono break-all text-left block bg-background/60 p-3 rounded-md space-y-1 border">
                  <p>
                    <strong className="font-semibold">Username:</strong>{" "}
                    {session?.user?.username ?? "null"}
                  </p>
                  <p>
                    <strong className="font-semibold">Email:</strong>{" "}
                    {session?.user?.email ?? "null"}
                  </p>
                  <p>
                    <strong className="font-semibold">Permissão (.env):</strong>{" "}
                    {process.env.ADMIN_USERS ?? "null"}
                  </p>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  const { signOut } = await import("@/lib/auth");
                  await signOut({ redirectTo: "/painel/login" });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-12 text-base font-semibold"
                >
                  Desconectar conta atual
                </Button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/painel" });
              }}
            >
              <Button type="submit" className="w-full h-12 text-base font-semibold gap-3" size="lg">
                <GitHubIcon className="h-5 w-5" />
                Entrar com GitHub
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            Apenas administradores autorizados podem acessar este painel.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
