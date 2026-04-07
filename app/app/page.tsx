"use client";
import { useEffect, useState } from "react";
import { formatUsd, getAllProperties, Property } from "../lib/mockData";

function PropertyCard({ p }: { p: Property }) {
  const soldPct = Math.round((p.soldShares / p.totalShares) * 100);
  return (
    <a href={`/property/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, overflow: "hidden", transition: "all 0.2s",
        cursor: "pointer",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(153,69,255,0.5)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(153,69,255,0.15)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {/* EDS Badge */}
          {p.edsVerified && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(20,241,149,0.15)", border: "1px solid rgba(20,241,149,0.4)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}>
              <span style={{ color: "#14F195", fontSize: 12 }}>✓</span>
              <span style={{ color: "#14F195", fontSize: 11, fontWeight: 600 }}>ЭЦП НУЦ РК</span>
            </div>
          )}
          {/* Type badge */}
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 10px", backdropFilter: "blur(8px)" }}>
            <span style={{ color: "#a0a0b0", fontSize: 11 }}>{p.type === "residential" ? "Жилая" : p.type === "office" ? "Офис" : "Коммерческая"}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8f0" }}>{p.name}</div>
            <div style={{ fontSize: 13, color: "#6b6b80", marginTop: 2 }}>📍 {p.location}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b6b80" }}>Оценка</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e8f0" }}>{formatUsd(p.valuationUsd)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#6b6b80" }}>Доходность</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#14F195" }}>{p.annualYieldPercent}%</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#6b6b80" }}>Продано долей</span>
              <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 600 }}>{soldPct}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${soldPct}%`, background: "linear-gradient(90deg, #9945FF, #14F195)", borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, color: "#6b6b80" }}>Цена доли: </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>${p.pricePerShare}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 600, fontSize: 13, borderRadius: 8, padding: "8px 16px" }}>
              Инвестировать →
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function MarketplacePage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setProperties(getAllProperties());
    const onFocus = () => setProperties(getAllProperties());
    const onStorage = () => setProperties(getAllProperties());
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ color: "#9945FF", fontSize: 12, fontWeight: 600 }}>🇰🇿 КАЗАХСТАН · SOLANA DEVNET</span>
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
          Фракционное владение<br />
          <span style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            реальными активами
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#6b6b80", maxWidth: 560, margin: "0 auto 32px" }}>
          Инвестируй в недвижимость Казахстана от $1. Право собственности подтверждено <strong style={{ color: "#14F195" }}>ЭЦП НУЦ РК</strong> и записано на блокчейне Solana.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 32 }}>
          {[
            { label: "Токенизировано", value: "$1.93M" },
            { label: "Инвесторов", value: "247" },
            { label: "Средний yield", value: "7.5%" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#e8e8f0" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6b6b80" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Why Solana */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[
            { icon: "⚡", label: "400ms", desc: "финализация блока" },
            { icon: "💸", label: "$0.00025", desc: "комиссия за транзакцию" },
            { icon: "🔐", label: "SPL Token", desc: "стандарт токенов" },
            { icon: "🇰🇿", label: "ЭЦП НУЦ РК", desc: "proof-of-asset" },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 16px" }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0" }}>{f.label}</span>
              <span style={{ fontSize: 12, color: "#6b6b80" }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 32, marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#a0a0b0", marginBottom: 24, textAlign: "center" }}>КАК ЭТО РАБОТАЕТ</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { icon: "🔏", step: "1", title: "ЭЦП подпись", desc: "Владелец подписывает документы через ЭЦП НУЦ РК" },
            { icon: "🪙", step: "2", title: "Токенизация", desc: "1 000 000 SPL токенов = 100% объекта на Solana" },
            { icon: "💼", step: "3", title: "Инвестирование", desc: "Покупай доли через Phantom Wallet от $1" },
            { icon: "💰", step: "4", title: "Доход", desc: "Арендный доход распределяется on-chain пропорционально долям" },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: "center", padding: "16px 8px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "#9945FF", fontWeight: 700, marginBottom: 4 }}>ШАГ {item.step}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b6b80", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Properties grid */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>Открытые объекты</h2>
        <p style={{ fontSize: 14, color: "#6b6b80", marginBottom: 32 }}>Все объекты верифицированы через ЭЦП НУЦ РК</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {properties.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      </div>
    </main>
  );
}
