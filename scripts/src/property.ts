import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  ExtensionType,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { connection, COMMITMENT, TRANSFER_HOOK_PROGRAM_ID } from "./config";
import { MOCK_MODE } from "./wallet";
import { simCreateMint, simGetOrCreateAta, simMintTo } from "./simulator";
import { PropertyRecord, TokenizationResult } from "./types";

/**
 * Tokenizes a real estate property as a Token-2022 SPL Token.
 *
 * Token-2022 extensions enabled:
 *   - TransferHook: calls the KYC whitelist program on every transfer
 *
 * The EDS hash (Kazakhstan ЭЦП НУЦ РК signature) is embedded in the
 * PropertyRecord and should be stored on-chain via the rwa-tokenizer
 * Anchor program's `initialize_property` instruction.
 */
export async function tokenizeProperty(
  config: {
    id: string; name: string; location: string;
    valuationUsd: number; totalShares: number; decimals: number; edsHash?: string;
  },
  issuer: Keypair
): Promise<TokenizationResult> {
  let mintAddress: PublicKey;
  let issuerAtaAddress: PublicKey;
  let mintToSignature: string;

  if (MOCK_MODE) {
    mintAddress = await simCreateMint(issuer);
    issuerAtaAddress = await simGetOrCreateAta(mintAddress, issuer.publicKey);
    mintToSignature = await simMintTo(mintAddress, issuer.publicKey, BigInt(config.totalShares));
  } else {
    // ── Token-2022 mint with TransferHook extension ──────────────────────────
    const hookProgramId = new PublicKey(TRANSFER_HOOK_PROGRAM_ID);
    const extensions = [ExtensionType.TransferHook];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const mintKeypair = Keypair.generate();
    mintAddress = mintKeypair.publicKey;

    const createMintTx = new Transaction().add(
      // 1. Create mint account
      SystemProgram.createAccount({
        fromPubkey: issuer.publicKey,
        newAccountPubkey: mintAddress,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      // 2. Initialize TransferHook extension BEFORE mint
      createInitializeTransferHookInstruction(
        mintAddress,
        issuer.publicKey,   // authority that can update the hook
        hookProgramId,
        TOKEN_2022_PROGRAM_ID,
      ),
      // 3. Initialize the mint itself
      createInitializeMintInstruction(
        mintAddress,
        config.decimals,
        issuer.publicKey,   // mint authority
        null,               // freeze authority
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    await sendAndConfirmTransaction(connection, createMintTx, [issuer, mintKeypair], { commitment: COMMITMENT });

    // ── Create issuer ATA and mint all shares ──────────────────────────────
    const issuerAta = await getOrCreateAssociatedTokenAccount(
      connection, issuer, mintAddress, issuer.publicKey,
      false, COMMITMENT, undefined,
      TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
    );
    issuerAtaAddress = issuerAta.address;

    mintToSignature = await mintTo(
      connection, issuer, mintAddress, issuerAtaAddress, issuer,
      BigInt(config.totalShares), [], { commitment: COMMITMENT }, TOKEN_2022_PROGRAM_ID
    );

    await getMint(connection, mintAddress, COMMITMENT, TOKEN_2022_PROGRAM_ID);
  }

  const property: PropertyRecord = {
    id: config.id, name: config.name, location: config.location,
    valuationUsd: config.valuationUsd, totalShares: config.totalShares,
    pricePerShareUsd: config.valuationUsd / config.totalShares,
    mintAuthority: issuer, mintAddress, decimals: config.decimals,
    edsHash: config.edsHash,
  };

  return {
    property, issuerTokenAccount: issuerAtaAddress,
    mintSignature: mintAddress.toBase58(),
    mintToSignature, totalSharesMinted: config.totalShares,
  };
}
