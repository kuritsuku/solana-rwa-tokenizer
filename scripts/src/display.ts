import chalk from "chalk";
import { TokenizationResult, PurchaseResult, TransferResult, YieldDistribution, InvestorRecord } from "./types";

const EXPLORER = "https://explorer.solana.com";
const shortKey = (k: string) => `${k.slice(0, 4)}…${k.slice(-4)}`;
const shortSig = (s: string) => `${s.slice(0, 6)}…${s.slice(-6)}`;
const usd = (n: number) => "$" + n.toLocaleString("en-US");
const line = (w = 64) => "─".repeat(w);

export function printBanner(): void {
  console.log();
  console.log(chalk.bgBlue.bold.white("                                                                  "));
  console.log(chalk.bgBlue.bold.white("   🏠  RWA TOKENIZER — SOLANA HACKATHON DEMO                     "));
  console.log(chalk.bgBlue.bold.white("   🇰🇿  Fractional Real Estate · ЭЦП НУЦ РК · Devnet             "));
  console.log(chalk.bgBlue.bold.white("                                                                  "));
  console.log();
}

export function printPhaseHeader(phase: number, title: string): void {
  console.log();
  console.log(chalk.bold.yellow(`${"═".repeat(4)} PHASE ${phase}: ${title} ${"═".repeat(4)}`));
  console.log();
}

export function printStep(label: string, value: string, extra?: string): void {
  const ext = extra ? chalk.dim(`  (${extra})`) : "";
  console.log(`  ${chalk.green("✔")} ${chalk.white(label.padEnd(28))} ${chalk.cyan(value)}${ext}`);
}

export function printInfo(msg: string): void {
  console.log(`  ${chalk.dim("›")} ${chalk.dim(msg)}`);
}

export function printWarn(msg: string): void {
  console.log(`  ${chalk.yellow("⚠")} ${chalk.yellow(msg)}`);
}

export function printError(msg: string, err?: unknown): void {
  console.error(`\n  ${chalk.bold.red("✖ ERROR:")} ${chalk.red(msg)}`);
  if (err instanceof Error) console.error(chalk.dim(`    ${err.message}`));
}

export function printSeparator(): void {
  console.log(chalk.dim(line()));
}

export function printExplorerTx(label: string, sig: string): void {
  console.log(`  ${chalk.dim("🔗")} ${chalk.dim(label + ":")} ${chalk.cyan.underline(`${EXPLORER}/tx/${sig}?cluster=devnet`)}`);
}

export function printWalletTable(
  wallets: Array<{ label: string; pubkey: string; balance: number }>
): void {
  console.log("  " + chalk.bold("Wallet".padEnd(28)) + chalk.bold("Address".padEnd(14)) + chalk.bold("Balance (SOL)"));
  console.log("  " + chalk.dim(line(56)));
  for (const w of wallets) {
    console.log("  " + chalk.white(w.label.padEnd(28)) + chalk.dim(shortKey(w.pubkey).padEnd(14)) + chalk.green(w.balance.toFixed(4) + " SOL"));
  }
  console.log();
}

export function printPropertyCard(result: TokenizationResult): void {
  const p = result.property;
  const b = chalk.bold;
  console.log(b("  ╔══════════════════════════════════════════════════════════╗"));
  console.log(b("  ║") + b.white("  TOKENIZED PROPERTY                                      ") + b("║"));
  console.log(b("  ╠══════════════════════════════════════════════════════════╣"));
  const row = (k: string, v: string) =>
    console.log(b("  ║ ") + chalk.white(k.padEnd(22)) + chalk.cyan(v.padEnd(36)) + b(" ║"));
  row("Property ID",    p.id);
  row("Name",           p.name);
  row("Location",       p.location);
  row("Valuation",      usd(p.valuationUsd));
  row("Total Shares",   p.totalShares.toLocaleString() + " tokens");
  row("Price / Share",  usd(p.pricePerShareUsd));
  row("Mint Address",   shortKey(p.mintAddress.toBase58()));
  if (p.edsHash) row("ЭЦП Hash",      "✓ " + p.edsHash + " (НУЦ РК)");
  console.log(b("  ╚══════════════════════════════════════════════════════════╝"));
  console.log();
}

export function printPurchaseTable(purchases: PurchaseResult[]): void {
  console.log("  " + chalk.bold("Investor".padEnd(12)) + chalk.bold("Shares".padEnd(14)) + chalk.bold("USD Value".padEnd(14)) + chalk.bold("Ownership %".padEnd(14)) + chalk.bold("Tx"));
  console.log("  " + chalk.dim(line(70)));
  const totalShares = purchases.reduce((s, p) => s + p.sharesBought, 0);
  for (const p of purchases) {
    const pct = ((p.sharesBought / 1_000_000) * 100).toFixed(1);
    console.log("  " + chalk.white(p.investor.name.padEnd(12)) + chalk.cyan(p.sharesBought.toLocaleString().padEnd(14)) + chalk.green(usd(p.usdValue).padEnd(14)) + chalk.yellow((pct + "%").padEnd(14)) + chalk.dim(shortSig(p.transferSignature)));
  }
  console.log("  " + chalk.dim(line(70)));
  console.log("  " + chalk.bold("TOTAL".padEnd(12)) + chalk.bold.cyan(totalShares.toLocaleString().padEnd(14)) + chalk.bold.green(usd(purchases.reduce((s, p) => s + p.usdValue, 0)).padEnd(14)) + chalk.bold.yellow(((totalShares / 1_000_000) * 100).toFixed(1) + "%"));
  console.log();
}

export function printTransferResult(result: TransferResult): void {
  console.log(`  ${chalk.green("✔")} ${chalk.white(result.from.name)} ${chalk.dim("→")} ${chalk.white(result.to.name)}  ${chalk.cyan(result.sharesTransferred.toLocaleString() + " shares")}`);
  printExplorerTx("Tx", result.signature);
  console.log();
}

export function printOwnershipTable(
  snapshot: Array<{ investor: InvestorRecord; ownershipPercent: number }>
): void {
  console.log("  " + chalk.bold("Investor".padEnd(12)) + chalk.bold("Shares".padEnd(14)) + chalk.bold("Ownership %") + "  " + chalk.bold("Bar"));
  console.log("  " + chalk.dim(line(55)));
  for (const { investor, ownershipPercent } of snapshot) {
    const bar = "█".repeat(Math.round(ownershipPercent / 2));
    console.log("  " + chalk.white(investor.name.padEnd(12)) + chalk.cyan(investor.sharesOwned.toLocaleString().padEnd(14)) + chalk.yellow((ownershipPercent.toFixed(2) + "%").padEnd(13)) + chalk.blue(bar));
  }
  console.log();
}

export function printYieldReport(dist: YieldDistribution): void {
  console.log(chalk.bold(`  Distributing ${chalk.cyan("$" + dist.totalYieldUsdc.toFixed(2) + " USDC")} yield pool (simulated annual rental income)`));
  console.log();
  console.log("  " + chalk.bold("Investor".padEnd(12)) + chalk.bold("Shares".padEnd(14)) + chalk.bold("Ownership %".padEnd(14)) + chalk.bold("Yield (USDC)".padEnd(15)) + chalk.bold("Tx"));
  console.log("  " + chalk.dim(line(72)));
  for (const d of dist.distributions) {
    console.log("  " + chalk.white(d.investor.name.padEnd(12)) + chalk.cyan(d.investor.sharesOwned.toLocaleString().padEnd(14)) + chalk.yellow((d.ownershipPercent.toFixed(2) + "%").padEnd(14)) + chalk.green(("$" + d.yieldUsdc.toFixed(4) + " USDC").padEnd(15)) + chalk.dim(shortSig(d.signature)));
  }
  console.log("  " + chalk.dim(line(72)));
  console.log("  " + chalk.bold("TOTAL".padEnd(40)) + chalk.bold.green("$" + dist.distributions.reduce((s, d) => s + d.yieldUsdc, 0).toFixed(4) + " USDC"));
  console.log();
}

export function printFinalSummary(investors: InvestorRecord[], totalShares: number): void {
  console.log(chalk.bold("  Final portfolio state:"));
  console.log();
  for (const inv of investors) {
    const pct = ((inv.sharesOwned / totalShares) * 100).toFixed(2);
    console.log(`  ${chalk.bold.white(inv.name.padEnd(10))}  ${chalk.cyan(inv.sharesOwned.toLocaleString().padStart(9) + " shares")}  ${chalk.yellow((pct + "%").padStart(7))} ownership  ${chalk.dim(shortKey(inv.wallet.publicKey.toBase58()))}`);
  }
  console.log();
}
