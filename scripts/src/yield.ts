import {
  Keypair, SystemProgram, Transaction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { connection, COMMITMENT } from "./config";
import { MOCK_MODE } from "./wallet";
import { simTransferSol } from "./simulator";
import { InvestorRecord, PropertyRecord, YieldDistribution, YieldEntry } from "./types";

export async function distributeYield(
  yieldPoolSol: number, property: PropertyRecord,
  investors: InvestorRecord[], yieldPayer: Keypair
): Promise<YieldDistribution> {
  const active = investors.filter((inv) => inv.sharesOwned > 0);
  const totalOutstanding = active.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const distributions: YieldEntry[] = [];

  for (const investor of active) {
    const fraction = investor.sharesOwned / totalOutstanding;
    const yieldSol = parseFloat((fraction * yieldPoolSol).toFixed(6));
    const lamports = Math.floor(fraction * yieldPoolSol * LAMPORTS_PER_SOL);
    if (lamports === 0) continue;

    let signature: string;
    if (MOCK_MODE) {
      signature = await simTransferSol(yieldPayer, investor.wallet.publicKey, yieldSol);
    } else {
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: yieldPayer.publicKey, toPubkey: investor.wallet.publicKey, lamports })
      );
      signature = await sendAndConfirmTransaction(connection, tx, [yieldPayer], { commitment: COMMITMENT });
    }
    distributions.push({ investor, yieldSol, ownershipPercent: fraction * 100, signature });
  }
  return { totalYieldSol: yieldPoolSol, property, distributions };
}
