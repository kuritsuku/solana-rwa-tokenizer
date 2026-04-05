"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) { setBalance(null); return; }
    const conn = new Connection(clusterApiUrl("devnet"));
    conn.getBalance(publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL));
  }, [publicKey]);

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#14F195", fontWeight: 600 }}>
            {addr.slice(0, 4)}…{addr.slice(-4)}
          </div>
          {balance !== null && (
            <div style={{ fontSize: 11, color: "#6b6b80" }}>{balance.toFixed(3)} SOL</div>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          style={{ background: "rgba(255,255,255,0.08)", color: "#a0a0b0", fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "7px 16px", cursor: "pointer" }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "9px 20px", cursor: "pointer" }}
    >
      Connect Wallet
    </button>
  );
}
