import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as crypto from "crypto";

const balances = new Map<string, number>();
const tokenAccounts = new Map<string, bigint>();

function fakeSig(): string {
  return crypto.randomBytes(64).toString("base64url").slice(0, 88);
}

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ataKey(mint: PublicKey, owner: PublicKey): string {
  return `${mint.toBase58()}:${owner.toBase58()}`;
}

export async function simAirdrop(keypair: Keypair, sol: number): Promise<string> {
  await delay(600);
  const key = keypair.publicKey.toBase58();
  balances.set(key, (balances.get(key) ?? 0) + sol * LAMPORTS_PER_SOL);
  return fakeSig();
}

export async function simTransferSol(
  from: Keypair,
  toPubkey: PublicKey,
  sol: number
): Promise<string> {
  await delay(400);
  const fromKey = from.publicKey.toBase58();
  const toKey = toPubkey.toBase58();
  const lamports = Math.floor(sol * LAMPORTS_PER_SOL);
  balances.set(fromKey, (balances.get(fromKey) ?? 0) - lamports);
  balances.set(toKey, (balances.get(toKey) ?? 0) + lamports);
  return fakeSig();
}

export function simGetBalance(pubkey: PublicKey): number {
  return (balances.get(pubkey.toBase58()) ?? 0) / LAMPORTS_PER_SOL;
}

/**
 * Pre-seeds the in-memory USDC balance for a yield pool wallet.
 * Call before distributeYield() in mock mode.
 */
export async function simFundUsdcPool(
  yieldPayer: Keypair,
  usdcMint: PublicKey,
  amountUsdc: number,
  usdcDecimals: number
): Promise<void> {
  const key = ataKey(usdcMint, yieldPayer.publicKey);
  const atomic = BigInt(Math.floor(amountUsdc * 10 ** usdcDecimals));
  tokenAccounts.set(key, (tokenAccounts.get(key) ?? BigInt(0)) + atomic);
}

let mintCounter = 0;
export async function simCreateMint(issuer: Keypair): Promise<PublicKey> {
  await delay(700);
  const seed = Buffer.concat([issuer.publicKey.toBuffer(), Buffer.from([mintCounter++])]);
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return new PublicKey(bytes);
}

export async function simGetOrCreateAta(
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  await delay(300);
  const key = ataKey(mint, owner);
  if (!tokenAccounts.has(key)) tokenAccounts.set(key, BigInt(0));
  const seed = crypto.createHash("sha256").update(key).digest();
  return new PublicKey(seed);
}

export async function simMintTo(
  mint: PublicKey,
  owner: PublicKey,
  amount: bigint
): Promise<string> {
  await delay(500);
  const key = ataKey(mint, owner);
  tokenAccounts.set(key, (tokenAccounts.get(key) ?? BigInt(0)) + amount);
  return fakeSig();
}

export async function simTransferTokens(
  mint: PublicKey,
  fromOwner: PublicKey,
  toOwner: PublicKey,
  amount: bigint
): Promise<string> {
  await delay(450);
  const fromKey = ataKey(mint, fromOwner);
  const toKey = ataKey(mint, toOwner);
  const fromBal = tokenAccounts.get(fromKey) ?? BigInt(0);
  if (fromBal < amount) throw new Error("Insufficient token balance");
  tokenAccounts.set(fromKey, fromBal - amount);
  tokenAccounts.set(toKey, (tokenAccounts.get(toKey) ?? BigInt(0)) + amount);
  return fakeSig();
}
