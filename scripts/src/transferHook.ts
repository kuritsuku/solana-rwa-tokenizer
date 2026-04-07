import { createHash } from "crypto";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { connection, COMMITMENT, TRANSFER_HOOK_PROGRAM_ID } from "./config";

function discriminator(ixName: string): Buffer {
  return createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

function getKycWhitelistPda(mint: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc-whitelist"), mint.toBuffer()],
    programId,
  )[0];
}

function getExtraAccountMetaListPda(mint: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    programId,
  )[0];
}

function createInitializeKycWhitelistInstruction(params: {
  mint: PublicKey;
  admin: PublicKey;
  programId: PublicKey;
}): TransactionInstruction {
  const kycWhitelist = getKycWhitelistPda(params.mint, params.programId);
  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: kycWhitelist, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.admin, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("initialize_kyc_whitelist"),
  });
}

function createInitializeExtraAccountMetasInstruction(params: {
  mint: PublicKey;
  payer: PublicKey;
  programId: PublicKey;
}): TransactionInstruction {
  const extraMetaList = getExtraAccountMetaListPda(params.mint, params.programId);
  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: extraMetaList, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("initialize_extra_account_metas"),
  });
}

function createAddToWhitelistInstruction(params: {
  mint: PublicKey;
  admin: PublicKey;
  wallet: PublicKey;
  programId: PublicKey;
}): TransactionInstruction {
  const kycWhitelist = getKycWhitelistPda(params.mint, params.programId);
  const data = Buffer.concat([discriminator("add_to_whitelist"), params.wallet.toBuffer()]);

  return new TransactionInstruction({
    programId: params.programId,
    keys: [
      { pubkey: kycWhitelist, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.admin, isSigner: true, isWritable: false },
    ],
    data,
  });
}

export async function initializeTransferHookForMint(
  mint: PublicKey,
  admin: Keypair,
  walletsToWhitelist: PublicKey[],
): Promise<void> {
  const hookProgramId = new PublicKey(TRANSFER_HOOK_PROGRAM_ID);
  const initTx = new Transaction().add(
    createInitializeKycWhitelistInstruction({
      mint,
      admin: admin.publicKey,
      programId: hookProgramId,
    }),
    createInitializeExtraAccountMetasInstruction({
      mint,
      payer: admin.publicKey,
      programId: hookProgramId,
    }),
  );
  await sendAndConfirmTransaction(connection, initTx, [admin], { commitment: COMMITMENT });

  const uniqueWallets = new Map<string, PublicKey>();
  for (const wallet of walletsToWhitelist) {
    uniqueWallets.set(wallet.toBase58(), wallet);
  }

  const whitelistTx = new Transaction();
  for (const wallet of uniqueWallets.values()) {
    whitelistTx.add(
      createAddToWhitelistInstruction({
        mint,
        admin: admin.publicKey,
        wallet,
        programId: hookProgramId,
      }),
    );
  }
  await sendAndConfirmTransaction(connection, whitelistTx, [admin], { commitment: COMMITMENT });
}
