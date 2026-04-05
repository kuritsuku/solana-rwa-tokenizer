import type { Metadata } from "next";
import "./globals.css";
import SolanaWalletProvider from "../components/WalletProvider";
import WalletButton from "../components/WalletButton";

export const metadata: Metadata = {
  title: "RWA Tokenizer — Fractional Real Estate on Solana",
  description: "Tokenize real estate. Buy fractional shares. Earn yield. Verified by Kazakhstan EDS (ЭЦП НУЦ РК).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: "#0a0a0f", color: "#e8e8f0", minHeight: "100vh", margin: 0 }}>
        <SolanaWalletProvider>
          <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🏠</span>
                <a href="/" style={{ fontWeight: 700, fontSize: 18, color: "#e8e8f0", textDecoration: "none" }}>RWA Tokenizer</a>
                <span style={{ fontSize: 11, background: "rgba(153,69,255,0.15)", color: "#9945FF", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 6, padding: "2px 8px" }}>Solana Devnet</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <a href="/" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Маркетплейс</a>
                <a href="/portfolio" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Портфель</a>
                <a href="/tokenize" style={{ color: "#a0a0b0", fontSize: 14, textDecoration: "none" }}>Токенизировать</a>
                <WalletButton />
              </div>
            </div>
          </nav>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
