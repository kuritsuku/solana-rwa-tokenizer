import { Connection, clusterApiUrl, Commitment } from "@solana/web3.js";

export const COMMITMENT: Commitment = "confirmed";
export const connection = new Connection(clusterApiUrl("devnet"), COMMITMENT);

export const DEMO_PROPERTY = {
  id: "PROP-KZ-001",
  name: "ЖК Нурлы Жол, Алматы",
  location: "Алматы, Казахстан, ул. Достык 12",
  valuationUsd: 450_000,
  totalShares: 1_000_000,
  decimals: 0,
  // Simulated EDS (ЭЦП НУЦ РК) hash of ownership document
  edsHash: "a3f8c2d1e9b47056",
};

export const INVESTOR_PURCHASES = [
  { name: "Айгерим", shares: 250_000 },
  { name: "Данияр",  shares: 150_000 },
  { name: "Сания",   shares: 100_000 },
];

export const SECONDARY_TRANSFER_SHARES = 50_000;
export const ANNUAL_YIELD_SOL = 0.3;
export const AIRDROP_SOL = 2;
