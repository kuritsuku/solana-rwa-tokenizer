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

// USDC yield pool (replaces SOL — 30 USDC annual rental income for demo)
export const ANNUAL_YIELD_USDC = 30; // in USDC (6 decimals → × 1_000_000)
// Devnet USDC mint: https://explorer.solana.com/address/Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr?cluster=devnet
export const USDC_MINT_DEVNET = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
export const USDC_DECIMALS = 6;

export const AIRDROP_SOL = 2;

// Anchor program ID (deployed on Devnet via Solana Playground)
export const RWA_PROGRAM_ID = "C9FUrbEatQASUhbvvAA1XRHVeMFxTgX3QvVFNt5cKYnn";

// Token-2022 TransferHook program ID (deployed on Devnet)
export const TRANSFER_HOOK_PROGRAM_ID = "DueqM2eEUpHR7SFm957Xd8kAmykXKUqjy1sLoXHVwv3p";
