import { Keypair, PublicKey } from "@solana/web3.js";

export interface PropertyRecord {
  id: string;
  name: string;
  location: string;
  valuationUsd: number;
  totalShares: number;
  pricePerShareUsd: number;
  mintAuthority: Keypair;
  mintAddress: PublicKey;
  decimals: number;
  edsHash?: string; // SHA-256 hash of EDS-signed ownership document
}

export interface InvestorRecord {
  name: string;
  wallet: Keypair;
  tokenAccount: PublicKey;
  mintAddress: PublicKey;
  sharesOwned: number;
}

export interface TokenizationResult {
  property: PropertyRecord;
  issuerTokenAccount: PublicKey;
  mintSignature: string;
  mintToSignature: string;
  totalSharesMinted: number;
}

export interface PurchaseResult {
  investor: InvestorRecord;
  sharesBought: number;
  usdValue: number;
  transferSignature: string;
}

export interface TransferResult {
  from: InvestorRecord;
  to: InvestorRecord;
  sharesTransferred: number;
  signature: string;
}

export interface YieldEntry {
  investor: InvestorRecord;
  yieldUsdc: number;   // in full USDC (e.g. 2.5 = $2.50)
  ownershipPercent: number;
  signature: string;
}

export interface YieldDistribution {
  totalYieldUsdc: number;
  property: PropertyRecord;
  distributions: YieldEntry[];
}
