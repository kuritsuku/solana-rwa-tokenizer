import { Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedWithTransferHookInstruction,
} from "@solana/spl-token";
import { connection, COMMITMENT } from "./config";
import { MOCK_MODE } from "./wallet";
import { simTransferTokens } from "./simulator";
import { InvestorRecord, TransferResult } from "./types";

export async function transferShares(
  from: InvestorRecord, to: InvestorRecord,
  shareAmount: number, fromKeypair: Keypair
): Promise<TransferResult> {
  if (shareAmount <= 0) throw new Error("Transfer amount must be positive");
  if (from.sharesOwned < shareAmount)
    throw new Error(`Insufficient shares: ${from.name} owns ${from.sharesOwned}, tried ${shareAmount}`);

  let signature: string;
  if (MOCK_MODE) {
    signature = await simTransferTokens(
      from.mintAddress, from.wallet.publicKey, to.wallet.publicKey, BigInt(shareAmount)
    );
  } else {
    const ix = await createTransferCheckedWithTransferHookInstruction(
      connection,
      from.tokenAccount,
      from.mintAddress,
      to.tokenAccount,
      fromKeypair.publicKey,
      BigInt(shareAmount),
      from.mintDecimals,
      [],
      COMMITMENT,
      TOKEN_2022_PROGRAM_ID,
    );

    const tx = new Transaction().add(ix);
    signature = await sendAndConfirmTransaction(connection, tx, [fromKeypair], { commitment: COMMITMENT });
  }
  from.sharesOwned -= shareAmount;
  to.sharesOwned += shareAmount;
  return { from, to, sharesTransferred: shareAmount, signature };
}

export function getOwnershipSnapshot(
  investors: InvestorRecord[], totalShares: number
): Array<{ investor: InvestorRecord; ownershipPercent: number }> {
  return investors
    .map((inv) => ({ investor: inv, ownershipPercent: (inv.sharesOwned / totalShares) * 100 }))
    .sort((a, b) => b.ownershipPercent - a.ownershipPercent);
}
