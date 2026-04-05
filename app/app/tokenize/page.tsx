"use client";
import { useState } from "react";

type Step = "upload" | "sign" | "mint" | "done";

export default function TokenizePage() {
  const [step, setStep] = useState<Step>("upload");
  const [form, setForm] = useState({ name: "", location: "", value: "", shares: "1000000", yield: "" });
  const [edsHash] = useState("a3f8c2d1e9b47056");
  const [mintAddress] = useState("EugEMt8ptWJHg496cywjVAc86GL9FPVvysogh2LsjUnK");

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Данные объекта" },
    { id: "sign",   label: "ЭЦП подпись" },
    { id: "mint",   label: "Выпуск токенов" },
    { id: "done",   label: "Готово" },
  ];

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e8e8f0", marginBottom: 8 }}>Токенизировать объект</h1>
      <p style={{ color: "#6b6b80", marginBottom: 40, fontSize: 14 }}>Создайте SPL Token, обеспеченный реальным активом и подписанный ЭЦП НУЦ РК</p>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
        {steps.map((s, i) => {
          const stepOrder: Step[] = ["upload", "sign", "mint", "done"];
          const done = stepOrder.indexOf(step) > i;
          const active = step === s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: done ? "#14F195" : active ? "#9945FF" : "rgba(255,255,255,0.08)", color: done || active ? "#000" : "#6b6b80", border: active ? "2px solid #9945FF" : "none" }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, color: active ? "#e8e8f0" : "#6b6b80", whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? "#14F195" : "rgba(255,255,255,0.08)", margin: "0 8px", marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>

        {step === "upload" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 24 }}>Данные объекта недвижимости</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Название объекта", key: "name", placeholder: "ЖК Нурлы Жол, кв. 142" },
                { label: "Адрес", key: "location", placeholder: "Алматы, ул. Достык 12" },
                { label: "Рыночная оценка (USD)", key: "value", placeholder: "450000" },
                { label: "Количество токенов (долей)", key: "shares", placeholder: "1000000" },
                { label: "Ожидаемый yield (%/год)", key: "yield", placeholder: "7.5" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 16px", color: "#e8e8f0", fontSize: 15, boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6, display: "block" }}>Документ о праве собственности (PDF)</label>
                <div style={{ border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "24px", textAlign: "center", color: "#6b6b80", fontSize: 14 }}>
                  📄 Перетащите PDF или нажмите для загрузки
                </div>
              </div>
            </div>
            <button onClick={() => setStep("sign")} style={{ marginTop: 24, width: "100%", background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer" }}>
              Далее: Подписать ЭЦП →
            </button>
          </div>
        )}

        {step === "sign" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>Подписать через ЭЦП НУЦ РК</h2>
            <p style={{ color: "#6b6b80", fontSize: 14, marginBottom: 24 }}>Подпишите документ государственной электронной подписью для подтверждения права собственности</p>
            <div style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.2)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#14F195", fontWeight: 600, marginBottom: 12 }}>Что будет подписано:</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#a0a0b0", lineHeight: 1.8 }}>
                {`{`}<br />
                {`  "property": "${form.name || "ЖК Нурлы Жол"}",`}<br />
                {`  "location": "${form.location || "Алматы, ул. Достык 12"}",`}<br />
                {`  "valuation": ${form.value || "450000"},`}<br />
                {`  "shares": ${form.shares},`}<br />
                {`  "timestamp": "${new Date().toISOString()}",`}<br />
                {`  "blockchain": "solana-devnet"`}<br />
                {`}`}
              </div>
            </div>
            <button onClick={() => setStep("mint")} style={{ width: "100%", background: "rgba(20,241,149,0.15)", border: "1px solid rgba(20,241,149,0.4)", color: "#14F195", fontWeight: 700, fontSize: 15, borderRadius: 12, padding: "14px 0", cursor: "pointer", marginBottom: 12 }}>
              🔏 Подписать через NCALayer (ЭЦП)
            </button>
            <p style={{ fontSize: 12, color: "#6b6b80", textAlign: "center" }}>Требуется установленный NCALayer и действующий сертификат ЭЦП НУЦ РК</p>
          </div>
        )}

        {step === "mint" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>Выпуск токенов на Solana</h2>
            <div style={{ background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.25)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#14F195", fontWeight: 600, marginBottom: 8 }}>✓ ЭЦП подпись получена</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6b6b80" }}>Hash: {edsHash}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, fontSize: 14 }}>
              {[
                { label: "Будет создан SPL Token Mint", status: "pending" },
                { label: `Выпущено ${parseInt(form.shares || "1000000").toLocaleString()} токенов`, status: "pending" },
                { label: "ЭЦП хэш записан on-chain", status: "pending" },
                { label: "Объект доступен на маркетплейсе", status: "pending" },
              ].map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, color: "#a0a0b0" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  {t.label}
                </div>
              ))}
            </div>
            <button onClick={() => setStep("done")} style={{ width: "100%", background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer" }}>
              🪙 Выпустить токены на Solana
            </button>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e8e8f0", marginBottom: 8 }}>Токены выпущены!</h2>
            <p style={{ color: "#6b6b80", marginBottom: 32 }}>Ваш объект токенизирован и доступен инвесторам</p>
            <div style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "left" }}>
              {[
                { label: "Mint Address", value: mintAddress.slice(0, 20) + "..." },
                { label: "ЭЦП Hash", value: edsHash },
                { label: "Токенов выпущено", value: parseInt(form.shares || "1000000").toLocaleString() },
                { label: "Сеть", value: "Solana Devnet" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                  <span style={{ color: "#6b6b80" }}>{r.label}</span>
                  <span style={{ color: "#9945FF", fontFamily: "monospace" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <a href="/" style={{ display: "inline-block", background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, borderRadius: 12, padding: "12px 32px", textDecoration: "none" }}>
              Перейти на маркетплейс →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
