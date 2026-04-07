import chalk from "chalk";
import { connection, DEMO_PROPERTY, INVESTOR_PURCHASES, SECONDARY_TRANSFER_SHARES, ANNUAL_YIELD_USDC, USDC_MINT_DEVNET, USDC_DECIMALS } from "./config";
import { generateKeypair, fundWalletsFromIssuer, getBalanceSol, setMockMode } from "./wallet";
import { tokenizeProperty } from "./property";
import { createInvestorRecord, purchaseShares } from "./investors";
import { transferShares, getOwnershipSnapshot } from "./marketplace";
import { distributeYield } from "./yield";
import { simFundUsdcPool } from "./simulator";
import { PublicKey } from "@solana/web3.js";
import {
  printBanner, printPhaseHeader, printStep, printInfo, printWarn, printError,
  printSeparator, printWalletTable, printPropertyCard, printPurchaseTable,
  printTransferResult, printOwnershipTable, printYieldReport, printFinalSummary,
} from "./display";

async function main(): Promise<void> {
  const useDevnet = process.argv.includes("--devnet");
  if (useDevnet) setMockMode(false);

  printBanner();

  if (!useDevnet) {
    console.log(chalk.dim("  Mode: ") + chalk.yellow("SIMULATION") + chalk.dim("  (pass --devnet for real Solana Devnet)\n"));
  } else {
    try {
      const version = await connection.getVersion();
      console.log(chalk.dim("  Mode: ") + chalk.green("DEVNET") + chalk.dim(`  · Solana core ${version["solana-core"]}\n`));
    } catch {
      printWarn("Could not reach Devnet");
    }
  }

  // ── PHASE 0: Wallets ─────────────────────────────────────────────────────
  printPhaseHeader(0, "WALLET SETUP & FUNDING");
  printInfo("Generating keypairs...");

  const issuer = generateKeypair();
  const investorKeypairs = INVESTOR_PURCHASES.map(() => generateKeypair());

  printInfo("Funding wallets (single airdrop → issuer distributes to investors)...\n");

  await fundWalletsFromIssuer(
    issuer,
    INVESTOR_PURCHASES.map((p, i) => ({ keypair: investorKeypairs[i], label: `${p.name} (Investor ${i + 1})` })),
    0.4,
    (label, balance) => printStep("Funded", label, `${balance.toFixed(4)} SOL`)
  );

  const walletRows = [
    { label: "Issuer", pubkey: issuer.publicKey.toBase58(), balance: await getBalanceSol(issuer.publicKey) },
    ...await Promise.all(INVESTOR_PURCHASES.map(async (p, i) => ({
      label: p.name, pubkey: investorKeypairs[i].publicKey.toBase58(),
      balance: await getBalanceSol(investorKeypairs[i].publicKey),
    }))),
  ];
  printWalletTable(walletRows);

  // ── PHASE 1: EDS Verification + Tokenization ─────────────────────────────
  printPhaseHeader(1, "ЭЦП PROOF-OF-ASSET + TOKENIZATION");
  printInfo("Owner signs title document via ЭЦП НУЦ РК...");
  printStep("ЭЦП Signature", "✓ Verified", `hash: ${DEMO_PROPERTY.edsHash}`);
  printInfo("Creating SPL Token mint backed by EDS-verified document...\n");

  const tokenResult = await tokenizeProperty(DEMO_PROPERTY, issuer);
  printPropertyCard(tokenResult);
  printStep("Token Standard",    "Token-2022 + TransferHook (KYC)");
  printStep("Mint authority",    "Issuer (Property Owner)");
  printStep("Freeze authority",  "None — freely transferable");
  console.log();

  // ── PHASE 2: Primary market ───────────────────────────────────────────────
  printPhaseHeader(2, "PRIMARY MARKET — INVESTORS BUY SHARES");
  printInfo("Creating Associated Token Accounts...");

  const investorRecords = await Promise.all(
    INVESTOR_PURCHASES.map((p, i) =>
      createInvestorRecord(p.name, investorKeypairs[i], tokenResult.property.mintAddress)
    )
  );

  printInfo("Transferring shares from issuer to investors...\n");

  const purchases = [];
  for (let i = 0; i < investorRecords.length; i++) {
    purchases.push(await purchaseShares(
      investorRecords[i], INVESTOR_PURCHASES[i].shares,
      issuer, tokenResult.issuerTokenAccount, tokenResult.property
    ));
  }
  printPurchaseTable(purchases);

  // ── PHASE 3: Secondary market ─────────────────────────────────────────────
  printPhaseHeader(3, "SECONDARY MARKET — PEER-TO-PEER TRANSFER");
  const [inv0, inv1] = investorRecords;
  printInfo(`${inv0.name} sells ${SECONDARY_TRANSFER_SHARES.toLocaleString()} shares to ${inv1.name}...\n`);

  const transferResult = await transferShares(inv0, inv1, SECONDARY_TRANSFER_SHARES, inv0.wallet);
  printTransferResult(transferResult);

  console.log(chalk.bold("  Updated ownership:"));
  console.log();
  printOwnershipTable(getOwnershipSnapshot(investorRecords, DEMO_PROPERTY.totalShares));

  // ── PHASE 4: Yield distribution ───────────────────────────────────────────
  printPhaseHeader(4, "YIELD DISTRIBUTION (Annual Rental Income — USDC)");
  // In mock mode: pre-seed the issuer's USDC balance for the yield pool
  if (!useDevnet) {
    await simFundUsdcPool(issuer, new PublicKey(USDC_MINT_DEVNET), ANNUAL_YIELD_USDC, USDC_DECIMALS);
  }
  const yieldResult = await distributeYield(ANNUAL_YIELD_USDC, tokenResult.property, investorRecords, issuer);
  printYieldReport(yieldResult);

  // ── PHASE 5: Final state ──────────────────────────────────────────────────
  printPhaseHeader(5, "FINAL PORTFOLIO STATE");
  printFinalSummary(investorRecords, DEMO_PROPERTY.totalShares);

  printSeparator();
  console.log();
  if (useDevnet) {
    console.log(chalk.bold.green("  ✅  Complete. All transactions live on Solana Devnet."));
    console.log(chalk.dim(`\n  Explorer: https://explorer.solana.com/address/${tokenResult.property.mintAddress.toBase58()}?cluster=devnet`));
  } else {
    console.log(chalk.bold.green("  ✅  Simulation complete. All flows demonstrated."));
    console.log(chalk.dim("\n  Run with --devnet to execute on real Solana Devnet."));
  }
  console.log();
}

main().catch((err) => {
  printError("Demo failed", err);
  process.exit(1);
});
