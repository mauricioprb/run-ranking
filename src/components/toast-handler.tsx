"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function ToastHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const isNewUser = searchParams.get("new");

    if (success === "true") {
      if (isNewUser === "true") {
        toast.success("Login realizado com sucesso!", {
          description: "Você será aprovado caso tenha sido convidado para o ranking.",
          duration: 5000,
        });
      } else {
        toast.success("Login realizado com sucesso!", {
          description: "Suas informações foram sincronizadas novamente.",
          duration: 5000,
        });
      }

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      newUrl.searchParams.delete("new");
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    } else if (error) {
      toast.error("Erro no login", {
        description: decodeURIComponent(error),
      });

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      newUrl.searchParams.delete("new");
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  return null;
}

export function ToastHandler() {
  return (
    <Suspense fallback={null}>
      <ToastHandlerContent />
    </Suspense>
  );
}
