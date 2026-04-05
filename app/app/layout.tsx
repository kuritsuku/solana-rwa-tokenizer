import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RWA Tokenizer — Fractional Real Estate on Solana",
  description: "Tokenize real estate. Buy fractional shares. Earn yield. Verified by Kazakhstan EDS (ЭЦП НУЦ РК).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen" style={{ background: "#0a0a0f", color: "#e8e8f0" }}>
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>🏠</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#e8e8f0" }}>RWA Tokenizer</span>
              <span style={{ fontSize: 12, background: "rgba(153,69,255,0.15)", color: "#9945FF", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 6, padding: "2px 8px" }}>Solana Devnet</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <a href="/" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Маркетплейс</a>
              <a href="/portfolio" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Портфель</a>
              <a href="/tokenize" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Токенизировать</a>
              <button style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 10, padding: "8px 20px", cursor: "pointer" }}>
                Connect Wallet
              </button>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
