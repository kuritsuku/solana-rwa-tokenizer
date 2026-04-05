import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

// ─── Program ID ────────────────────────────────────────────────────────────────
// Replace with the actual Program ID after deploying on Solana Playground
// e.g. "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
export const PROGRAM_ID = "11111111111111111111111111111111";

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// ─── PDA helper ────────────────────────────────────────────────────────────────
export async function getPropertyPDA(propertyId: string): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("property"), Buffer.from(propertyId)],
    new PublicKey(PROGRAM_ID)
  );
}

// ─── Explorer links ────────────────────────────────────────────────────────────
export function txLink(sig: string) {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function accountLink(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function programLink() {
  return `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;
}
