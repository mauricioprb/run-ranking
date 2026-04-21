import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel Admin — Runking",
  description: "Painel administrativo para gerenciamento de corredores",
  robots: "noindex, nofollow",
};

export default function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
