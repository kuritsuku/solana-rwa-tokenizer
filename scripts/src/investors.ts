import { Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
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
      connection, wallet, mintAddress, wallet.publicKey,
      false, COMMITMENT, undefined,
      TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
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
    // Use transferChecked with Token-2022; decimals = 0 for whole shares
    signature = await transferChecked(
      connection, issuer,
      issuerTokenAccount, property.mintAddress,
      investor.tokenAccount, issuer,
      BigInt(shareAmount), property.decimals,
      [], { commitment: COMMITMENT },
      TOKEN_2022_PROGRAM_ID
    );
  }
  investor.sharesOwned += shareAmount;
  return {
    investor, sharesBought: shareAmount,
    usdValue: Math.round(shareAmount * property.pricePerShareUsd),
    transferSignature: signature,
  };
}
