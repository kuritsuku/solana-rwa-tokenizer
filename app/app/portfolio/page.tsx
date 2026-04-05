import { PROPERTIES, formatUsd } from "../../lib/mockData";

// Simulated portfolio for demo
const MOCK_PORTFOLIO = [
  { propertyId: "prop-kz-001", sharesOwned: 50000, purchasePrice: 0.45 },
  { propertyId: "prop-kz-003", sharesOwned: 20000, purchasePrice: 0.28 },
];

export default function PortfolioPage() {
  const items = MOCK_PORTFOLIO.map((item) => {
    const property = PROPERTIES.find((p) => p.id === item.propertyId)!;
    const currentValue = item.sharesOwned * property.pricePerShare;
    const ownershipPct = (item.sharesOwned / property.totalShares) * 100;
    const annualYield = (currentValue * property.annualYieldPercent) / 100;
    return { ...item, property, currentValue, ownershipPct, annualYield };
  });

  const totalValue = items.reduce((s, i) => s + i.currentValue, 0);
  const totalYield = items.reduce((s, i) => s + i.annualYield, 0);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e8e8f0", marginBottom: 8 }}>Мой портфель</h1>
      <p style={{ color: "#6b6b80", marginBottom: 40, fontSize: 14 }}>Demo-режим · Подключите Phantom Wallet для реального портфеля</p>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Общая стоимость", value: formatUsd(totalValue), color: "#e8e8f0" },
          { label: "Годовой доход", value: formatUsd(totalYield), color: "#14F195" },
          { label: "Объектов", value: items.length.toString(), color: "#9945FF" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 13, color: "#6b6b80", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Holdings */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 20 }}>Мои активы</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((item) => (
          <div key={item.propertyId} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 20, alignItems: "center" }}>
            <img src={item.property.image} alt={item.property.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#e8e8f0", marginBottom: 4 }}>{item.property.name}</div>
              <div style={{ fontSize: 13, color: "#6b6b80", marginBottom: 8 }}>📍 {item.property.location}</div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 13, color: "#9945FF" }}>{item.sharesOwned.toLocaleString()} долей</span>
                <span style={{ fontSize: 13, color: "#a0a0b0" }}>{item.ownershipPct.toFixed(2)}% объекта</span>
                {item.property.edsVerified && (
                  <span style={{ fontSize: 12, color: "#14F195" }}>✓ ЭЦП НУЦ РК</span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e8f0", marginBottom: 4 }}>{formatUsd(item.currentValue)}</div>
              <div style={{ fontSize: 13, color: "#14F195" }}>+{formatUsd(item.annualYield)}/год</div>
            </div>
          </div>
        ))}
      </div>

      {/* Yield history */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 20 }}>История выплат</h2>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "#6b6b80" }}>
            <span>Дата</span><span>Объект</span><span>Сумма</span><span>Tx Hash</span>
          </div>
          {[
            { date: "01 апр 2026", name: "ЖК Нурлы Жол", amount: "$142.50", hash: "5xKz...a3F1" },
            { date: "01 мар 2026", name: "ЖК Нурлы Жол", amount: "$138.20", hash: "9pQm...b7E2" },
            { date: "01 мар 2026", name: "Апарт. Alatau", amount: "$37.80", hash: "2rNw...c4D3" },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 13 }}>
              <span style={{ color: "#a0a0b0" }}>{row.date}</span>
              <span style={{ color: "#e8e8f0" }}>{row.name}</span>
              <span style={{ color: "#14F195", fontWeight: 600 }}>{row.amount}</span>
              <span style={{ color: "#9945FF", fontFamily: "monospace", fontSize: 12 }}>{row.hash}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
