import { Keypair } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } from "@solana/spl-token";
import { connection, COMMITMENT } from "./config";
import { MOCK_MODE } from "./wallet";
import { simCreateMint, simGetOrCreateAta, simMintTo } from "./simulator";
import { PropertyRecord, TokenizationResult } from "./types";

export async function tokenizeProperty(
  config: {
    id: string; name: string; location: string;
    valuationUsd: number; totalShares: number; decimals: number; edsHash?: string;
  },
  issuer: Keypair
): Promise<TokenizationResult> {
  let mintAddress;
  let issuerAtaAddress;
  let mintToSignature: string;

  if (MOCK_MODE) {
    mintAddress = await simCreateMint(issuer);
    issuerAtaAddress = await simGetOrCreateAta(mintAddress, issuer.publicKey);
    mintToSignature = await simMintTo(mintAddress, issuer.publicKey, BigInt(config.totalShares));
  } else {
    mintAddress = await createMint(
      connection, issuer, issuer.publicKey, null, config.decimals,
      undefined, { commitment: COMMITMENT }
    );
    const issuerAta = await getOrCreateAssociatedTokenAccount(
      connection, issuer, mintAddress, issuer.publicKey, false, COMMITMENT
    );
    issuerAtaAddress = issuerAta.address;
    mintToSignature = await mintTo(
      connection, issuer, mintAddress, issuerAtaAddress, issuer,
      BigInt(config.totalShares), [], { commitment: COMMITMENT }
    );
    await getMint(connection, mintAddress, COMMITMENT);
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
