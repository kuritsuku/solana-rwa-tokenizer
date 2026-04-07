import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RwaTokenizer } from "../target/types/rwa_tokenizer";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("rwa-tokenizer", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RwaTokenizer as Program<RwaTokenizer>;
  const wallet = provider.wallet as anchor.Wallet;

  let mint: PublicKey;
  let issuerAta: PublicKey;
  const propertyId = "PROP-KZ-TEST";

  before(async () => {
    // Create Token-2022 mint for fractional shares
    mint = await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,   // mint authority
      null,               // freeze authority
      0,                  // 0 decimals (whole shares)
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    const ata = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      mint,
      wallet.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    issuerAta = ata.address;

    // Mint 1,000,000 shares to issuer
    await mintTo(
      provider.connection,
      wallet.payer,
      mint,
      issuerAta,
      wallet.publicKey,
      1_000_000,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
  });

  it("initializes a property with EDS hash", async () => {
    const [propertyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(propertyId)],
      program.programId,
    );

    await program.methods
      .initializeProperty(
        propertyId,
        "ЖК Нурлы Жол, Алматы",
        new anchor.BN(450_000),
        new anchor.BN(1_000_000),
        "a3f8c2d1e9b47056",
      )
      .accounts({
        propertyState: propertyPDA,
        mint,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.propertyState.fetch(propertyPDA);
    assert.equal(state.propertyId, propertyId);
    assert.equal(state.edsHash, "a3f8c2d1e9b47056");
    assert.equal(state.totalShares.toNumber(), 1_000_000);
    assert.equal(state.soldShares.toNumber(), 0);
  });

  it("records a share purchase", async () => {
    const investor = Keypair.generate();
    // Airdrop SOL to investor for account creation
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(investor.publicKey, 0.1 * 1e9),
    );

    const [propertyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(propertyId)],
      program.programId,
    );
    const [investorPositionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), Buffer.from(propertyId), investor.publicKey.toBuffer()],
      program.programId,
    );
    const investorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      mint,
      investor.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await program.methods
      .buyShares(propertyId, new anchor.BN(100_000))
      .accounts({
        propertyState: propertyPDA,
        investorPosition: investorPositionPDA,
        mint,
        issuerAta,
        investorAta: investorAta.address,
        issuer: wallet.publicKey,
        investor: investor.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([investor])
      .rpc();

    const position = await program.account.investorPosition.fetch(investorPositionPDA);
    assert.equal(position.sharesOwned.toNumber(), 100_000);

    const state = await program.account.propertyState.fetch(propertyPDA);
    assert.equal(state.soldShares.toNumber(), 100_000);
  });
});
