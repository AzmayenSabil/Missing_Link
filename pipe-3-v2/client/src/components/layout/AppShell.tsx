import type { ReactNode } from "react";
import Header from "./Header";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col cyber-bg"
      style={{ background: "#060d1f" }}
    >
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
