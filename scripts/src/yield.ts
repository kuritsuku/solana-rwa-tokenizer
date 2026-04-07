import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { connection, COMMITMENT, USDC_MINT_DEVNET, USDC_DECIMALS } from "./config";
import { MOCK_MODE } from "./wallet";
import { simTransferTokens } from "./simulator";
import { InvestorRecord, PropertyRecord, YieldDistribution, YieldEntry } from "./types";

/**
 * Distributes USDC yield proportionally to investors based on share ownership.
 *
 * In Devnet mode:
 *   - yieldPayer must have a funded USDC ATA
 *   - Uses SPL Token `transfer()` for each investor
 *
 * In mock mode:
 *   - Uses simTransferTokens() with USDC mint address
 */
export async function distributeYield(
  yieldPoolUsdc: number,
  property: PropertyRecord,
  investors: InvestorRecord[],
  yieldPayer: Keypair
): Promise<YieldDistribution> {
  const usdcMint = new PublicKey(USDC_MINT_DEVNET);
  const active = investors.filter((inv) => inv.sharesOwned > 0);
  const totalOutstanding = active.reduce((sum, inv) => sum + inv.sharesOwned, 0);
  const distributions: YieldEntry[] = [];

  // Ensure yield pool ATA exists (Devnet only)
  let payerUsdcAta: PublicKey | null = null;
  if (!MOCK_MODE) {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection, yieldPayer, usdcMint, yieldPayer.publicKey,
      false, COMMITMENT, undefined, TOKEN_2022_PROGRAM_ID
    );
    payerUsdcAta = ata.address;

    const requiredAtomicUnits = Math.floor(yieldPoolUsdc * 10 ** USDC_DECIMALS);
    const balanceInfo = await connection.getTokenAccountBalance(payerUsdcAta, COMMITMENT);
    const currentAtomicUnits = Number(balanceInfo.value.amount);
    if (currentAtomicUnits < requiredAtomicUnits) {
      const currentUsdc = currentAtomicUnits / 10 ** USDC_DECIMALS;
      throw new Error(
        `Insufficient devnet USDC for yield pool: need ${yieldPoolUsdc.toFixed(2)} USDC, have ${currentUsdc.toFixed(6)} USDC`,
      );
    }
  }

  for (const investor of active) {
    const fraction = investor.sharesOwned / totalOutstanding;
    // Convert to USDC atomic units (6 decimals)
    const yieldAtomicUnits = Math.floor(fraction * yieldPoolUsdc * 10 ** USDC_DECIMALS);
    const yieldUsdc = yieldAtomicUnits / 10 ** USDC_DECIMALS;
    if (yieldAtomicUnits === 0) continue;

    let signature: string;
    if (MOCK_MODE) {
      // Simulate USDC token transfer using shared token account simulator
      signature = await simTransferTokens(
        usdcMint, yieldPayer.publicKey, investor.wallet.publicKey, BigInt(yieldAtomicUnits)
      );
    } else {
      // Get or create investor's USDC ATA
      const investorUsdcAta = await getOrCreateAssociatedTokenAccount(
        connection, yieldPayer, usdcMint, investor.wallet.publicKey,
        false, COMMITMENT, undefined, TOKEN_2022_PROGRAM_ID
      );
      signature = await transfer(
        connection, yieldPayer, payerUsdcAta!, investorUsdcAta.address,
        yieldPayer, BigInt(yieldAtomicUnits), [], { commitment: COMMITMENT }, TOKEN_2022_PROGRAM_ID
      );
    }
    distributions.push({ investor, yieldUsdc, ownershipPercent: fraction * 100, signature });
  }
  return { totalYieldUsdc: yieldPoolUsdc, property, distributions };
}
