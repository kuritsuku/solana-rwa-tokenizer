import { Connection, clusterApiUrl, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";

// ─── Program IDs ───────────────────────────────────────────────────────────────
// Replace after deploying: anchor deploy --provider.cluster devnet
export const PROGRAM_ID = "4d7BYXSKiHwCN48E9oTBdXVjyw9Q27vMePkz3TgQH53N";
export const TRANSFER_HOOK_PROGRAM_ID = "DueqM2eEUpHR7SFm957Xd8kAmykXKUqjy1sLoXHVwv3p";

// Devnet USDC mint
export const USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// ─── PDA helpers ───────────────────────────────────────────────────────────────

/** PropertyState PDA — seeded ["property", propertyId] */
export function getPropertyPDA(propertyId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("property"), Buffer.from(propertyId)],
    new PublicKey(PROGRAM_ID),
  );
}

/** InvestorPosition PDA — seeded ["investor", propertyId, investorPubkey] */
export function getInvestorPositionPDA(
  propertyId: string,
  investor: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("investor"), Buffer.from(propertyId), investor.toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
}

/** KYC Whitelist PDA — seeded ["kyc-whitelist", mintPubkey] */
export function getKycWhitelistPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc-whitelist"), mint.toBuffer()],
    new PublicKey(TRANSFER_HOOK_PROGRAM_ID),
  );
}

/** ExtraAccountMetaList PDA — seeded ["extra-account-metas", mintPubkey] */
export function getExtraAccountMetasPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    new PublicKey(TRANSFER_HOOK_PROGRAM_ID),
  );
}

// ─── Anchor instruction builders ──────────────────────────────────────────────

function anchorDiscriminator(name: string): Buffer {
  return Buffer.from(
    createHash("sha256").update(`global:${name}`).digest()
  ).subarray(0, 8);
}

/**
 * Builds a `buy_shares` instruction for the rwa-tokenizer Anchor program.
 * Useful for calling the on-chain program from the Next.js frontend
 * without importing the full @coral-xyz/anchor package.
 */
export function buildBuySharesInstruction(params: {
  propertyId: string;
  shareAmount: bigint;
  propertyStatePDA: PublicKey;
  investorPositionPDA: PublicKey;
  mint: PublicKey;
  issuerAta: PublicKey;
  investorAta: PublicKey;
  issuer: PublicKey;
  investor: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}): TransactionInstruction {
  const discriminator = anchorDiscriminator("buy_shares");

  const propertyIdBytes = Buffer.from(params.propertyId, "utf8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(propertyIdBytes.length, 0);

  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(params.shareAmount, 0);

  const data = Buffer.concat([discriminator, lenBuf, propertyIdBytes, amountBuf]);

  return new TransactionInstruction({
    programId: new PublicKey(PROGRAM_ID),
    keys: [
      { pubkey: params.propertyStatePDA,       isSigner: false, isWritable: true  },
      { pubkey: params.investorPositionPDA,     isSigner: false, isWritable: true  },
      { pubkey: params.mint,                   isSigner: false, isWritable: true  },
      { pubkey: params.issuerAta,              isSigner: false, isWritable: true  },
      { pubkey: params.investorAta,            isSigner: false, isWritable: true  },
      { pubkey: params.issuer,                 isSigner: true,  isWritable: false },
      { pubkey: params.investor,               isSigner: true,  isWritable: true  },
      { pubkey: params.tokenProgram,           isSigner: false, isWritable: false },
      { pubkey: params.associatedTokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.systemProgram,          isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ─── Explorer links ────────────────────────────────────────────────────────────

export function txLink(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function accountLink(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function programLink(): string {
  return `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;
}
