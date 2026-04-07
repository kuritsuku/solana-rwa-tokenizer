import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { connection, AIRDROP_SOL, COMMITMENT } from "./config";
import { simAirdrop, simTransferSol, simGetBalance } from "./simulator";

export let MOCK_MODE = true;

export function setMockMode(value: boolean): void {
  MOCK_MODE = value;
}

export function generateKeypair(): Keypair {
  return Keypair.generate();
}

/**
 * Loads a Solana keypair from JSON file (same format as solana-cli id.json).
 */
export function loadKeypairFromFile(filePath: string): Keypair {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const secret = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export async function requestAirdrop(keypair: Keypair, solAmount = AIRDROP_SOL): Promise<string> {
  if (MOCK_MODE) return simAirdrop(keypair, solAmount);
  const lamports = solAmount * LAMPORTS_PER_SOL;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const signature = await connection.requestAirdrop(keypair.publicKey, lamports);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latestBlockhash }, COMMITMENT);
      return signature;
    } catch (err) {
      lastErr = err;
      if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 4000));
    }
  }
  throw new Error(`Airdrop failed: ${(lastErr as Error)?.message}`);
}

export async function getBalanceSol(pubkey: PublicKey): Promise<number> {
  if (MOCK_MODE) return simGetBalance(pubkey);
  return (await connection.getBalance(pubkey)) / LAMPORTS_PER_SOL;
}

export async function fundWalletsFromIssuer(
  issuer: Keypair,
  investors: Array<{ keypair: Keypair; label: string }>,
  solPerInvestor = 0.4,
  onFunded?: (label: string, balance: number) => void
): Promise<void> {
  let issuerBalance = await getBalanceSol(issuer.publicKey);
  const requiredForInvestors = investors.length * solPerInvestor;
  const feeBuffer = 0.15;
  const minRequiredBalance = requiredForInvestors + feeBuffer;

  if (issuerBalance < minRequiredBalance) {
    await requestAirdrop(issuer, AIRDROP_SOL);
    issuerBalance = await getBalanceSol(issuer.publicKey);
  }

  onFunded?.("Issuer (Property Owner)", issuerBalance);

  for (const { keypair, label } of investors) {
    if (MOCK_MODE) {
      await simTransferSol(issuer, keypair.publicKey, solPerInvestor);
    } else {
      const lamports = Math.floor(solPerInvestor * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: issuer.publicKey,
          toPubkey: keypair.publicKey,
          lamports,
        })
      );
      await sendAndConfirmTransaction(connection, tx, [issuer], { commitment: COMMITMENT });
    }
    const balance = await getBalanceSol(keypair.publicKey);
    onFunded?.(label, balance);
  }
}
