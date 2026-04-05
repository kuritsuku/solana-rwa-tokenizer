import { Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { connection, COMMITMENT } from "./config";
import { MOCK_MODE } from "./wallet";
import { simGetOrCreateAta, simTransferTokens } from "./simulator";
import { InvestorRecord, PropertyRecord, PurchaseResult } from "./types";

export async function createInvestorRecord(
  name: string, wallet: Keypair, mintAddress: PublicKey
): Promise<InvestorRecord> {
  let ataAddress: PublicKey;
  if (MOCK_MODE) {
    ataAddress = await simGetOrCreateAta(mintAddress, wallet.publicKey);
  } else {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection, wallet, mintAddress, wallet.publicKey, false, COMMITMENT
    );
    ataAddress = ata.address;
  }
  return { name, wallet, tokenAccount: ataAddress, mintAddress, sharesOwned: 0 };
}

export async function purchaseShares(
  investor: InvestorRecord, shareAmount: number,
  issuer: Keypair, issuerTokenAccount: PublicKey, property: PropertyRecord
): Promise<PurchaseResult> {
  if (shareAmount <= 0) throw new Error("Share amount must be positive");

  let signature: string;
  if (MOCK_MODE) {
    signature = await simTransferTokens(
      property.mintAddress, issuer.publicKey, investor.wallet.publicKey, BigInt(shareAmount)
    );
  } else {
    signature = await transfer(
      connection, issuer, issuerTokenAccount, investor.tokenAccount,
      issuer, BigInt(shareAmount), [], { commitment: COMMITMENT }
    );
  }
  investor.sharesOwned += shareAmount;
  return { investor, sharesBought: shareAmount, usdValue: Math.round(shareAmount * property.pricePerShareUsd), transferSignature: signature };
}
