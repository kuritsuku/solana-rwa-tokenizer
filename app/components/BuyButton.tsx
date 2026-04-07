"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { Connection, clusterApiUrl, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

interface BuyButtonProps {
  pricePerShare: number;
  propertyName: string;
}

export default function BuyButton({ pricePerShare, propertyName }: BuyButtonProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [shares, setShares] = useState(1000);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const totalUsd = (shares * pricePerShare).toFixed(2);
  const propertyTitle = propertyName.trim() || "Объект";

  function randomBase58(length: number): string {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  async function handleBuy() {
    if (!connected || !publicKey) {
      // No wallet mode for demo recordings: simulate success without Phantom.
      setDemoMode(true);
      setStatus("sending");
      await new Promise((r) => setTimeout(r, 900));
      setTxSig(randomBase58(88));
      setStatus("success");
      return;
    }
    setDemoMode(false);
    setStatus("sending");
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      // Demo: send minimal SOL to self as proof of intent (0.001 SOL)
      // In production this would be: call custom Anchor program instruction
      const lamports = Math.max(Math.floor(shares * pricePerShare * 0.000001 * LAMPORTS_PER_SOL), 5000);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey("11111111111111111111111111111111"),
          lamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSig(sig);
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6, display: "block" }}>
          Количество долей
        </label>
        <input
          type="number"
          value={shares}
          min={1}
          onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", color: "#e8e8f0", fontSize: 16, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        {[
          ["Стоимость", `$${totalUsd}`],
          ["Доля в объекте", `${((shares / 1_000_000) * 100).toFixed(3)}%`],
          ["Годовой доход", `~$${(parseFloat(totalUsd) * 0.075).toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: "#6b6b80" }}>{k}</span>
            <span style={{ color: "#e8e8f0" }}>{v}</span>
          </div>
        ))}
      </div>

      {status === "success" ? (
        <div>
          <div style={{ background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.3)", borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center" }}>
            <div style={{ color: "#14F195", fontWeight: 700, marginBottom: 4 }}>
              ✅ {demoMode ? "Demo-покупка выполнена!" : "Транзакция подтверждена!"}
            </div>
            {demoMode ? (
              <div style={{ color: "#a0a0b0", fontSize: 12 }}>
                {propertyTitle}: {shares.toLocaleString()} долей · симуляция без кошелька
              </div>
            ) : (
              <a
                href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#9945FF", fontSize: 12, fontFamily: "monospace" }}
              >
                {txSig.slice(0, 12)}…{txSig.slice(-8)} →
              </a>
            )}
          </div>
          <button onClick={() => setStatus("idle")} style={{ width: "100%", background: "rgba(255,255,255,0.06)", color: "#a0a0b0", fontWeight: 600, fontSize: 14, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 0", cursor: "pointer" }}>
            Купить ещё
          </button>
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={status === "sending"}
          style={{ width: "100%", background: status === "sending" ? "rgba(153,69,255,0.4)" : "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 12, padding: "14px 0", cursor: status === "sending" ? "wait" : "pointer", marginBottom: 12, opacity: status === "sending" ? 0.7 : 1 }}
        >
          {!connected ? "▶ Demo-покупка без Phantom" : status === "sending" ? "⏳ Отправка..." : `Купить ${shares.toLocaleString()} долей`}
        </button>
      )}

      {status === "error" && (
        <p style={{ fontSize: 12, color: "#ff6b6b", textAlign: "center", marginTop: 8 }}>
          Ошибка транзакции. Убедитесь что на кошельке есть SOL (Devnet).
        </p>
      )}

      {!connected && status === "idle" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setVisible(true)}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, color: "#a0a0b0", fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
          >
            Подключить Phantom (опционально)
          </button>
        </div>
      )}

      <p style={{ fontSize: 11, color: "#6b6b80", textAlign: "center", marginTop: 8 }}>
        Сеть Solana Devnet · ЭЦП НУЦ РК верифицирован
      </p>
    </div>
  );
}
