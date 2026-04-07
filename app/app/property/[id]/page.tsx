"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import BuyButton from "../../../components/BuyButton";
import { formatUsd, getPropertyById } from "../../../lib/mockData";

export default function PropertyPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const p = useMemo(() => (id ? getPropertyById(id) : undefined), [id]);

  if (!p) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <a href="/" style={{ color: "#6b6b80", fontSize: 14, textDecoration: "none" }}>
          ← Маркетплейс
        </a>
        <div style={{ marginTop: 32, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
          <h1 style={{ color: "#e8e8f0", margin: 0, fontSize: 24 }}>Объект не найден</h1>
          <p style={{ color: "#a0a0b0", marginTop: 12 }}>
            Возможно, объект был создан в другой сессии браузера.
          </p>
        </div>
      </main>
    );
  }

  const soldPct = Math.round((p.soldShares / p.totalShares) * 100);
  const availableShares = p.totalShares - p.soldShares;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <a href="/" style={{ color: "#6b6b80", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
        ← Маркетплейс
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32 }}>
        <div>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24, position: "relative" }}>
            <img src={p.image} alt={p.name} style={{ width: "100%", height: 360, objectFit: "cover" }} />
            {p.edsVerified && (
              <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(20,241,149,0.15)", border: "1px solid rgba(20,241,149,0.4)", borderRadius: 10, padding: "8px 14px", backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#14F195", fontSize: 16 }}>✓</span>
                  <div>
                    <div style={{ color: "#14F195", fontSize: 12, fontWeight: 700 }}>Верифицировано ЭЦП НУЦ РК</div>
                    <div style={{ color: "rgba(20,241,149,0.7)", fontSize: 11, fontFamily: "monospace" }}>Hash: {p.edsHash}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e8e8f0", marginBottom: 8 }}>{p.name}</h1>
          <p style={{ color: "#6b6b80", marginBottom: 24 }}>📍 {p.location} · {p.area} м² · {p.type === "residential" ? "Жилая" : "Офис"}</p>

          <p style={{ color: "#a0a0b0", lineHeight: 1.7, marginBottom: 32, fontSize: 15 }}>{p.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Рыночная оценка", value: formatUsd(p.valuationUsd), color: "#e8e8f0" },
              { label: "Годовой yield", value: `${p.annualYieldPercent}%`, color: "#14F195" },
              { label: "Цена 1 доли", value: `$${p.pricePerShare}`, color: "#9945FF" },
              { label: "Всего долей", value: p.totalShares.toLocaleString(), color: "#e8e8f0" },
              { label: "Продано", value: `${soldPct}%`, color: "#e8e8f0" },
              { label: "Доступно", value: availableShares.toLocaleString(), color: "#e8e8f0" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#6b6b80", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "sticky", top: 88 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 20 }}>Купить доли</h2>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#6b6b80" }}>Продано</span>
                <span style={{ fontSize: 13, color: "#a0a0b0", fontWeight: 600 }}>{soldPct}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${soldPct}%`, background: "linear-gradient(90deg, #9945FF, #14F195)", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: "#6b6b80", marginTop: 6 }}>{availableShares.toLocaleString()} долей доступно</div>
            </div>

            <BuyButton pricePerShare={p.pricePerShare} propertyName={p.name} />
          </div>
        </div>
      </div>
    </main>
  );
}
