# 🏠 RWA Tokenizer — Fractional Real Estate on Solana

> 🇬🇧 **EN:** Tokenize real estate. Buy fractional shares. Earn yield. Verified by Kazakhstan state digital signature (ЭЦП НУЦ РК).
>
> 🇷🇺 **RU:** Токенизируй недвижимость. Покупай доли. Получай доход. Право собственности подтверждено государственной ЭЦП НУЦ РК и записано на блокчейне Solana.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🇷🇺 О проекте (Russian)

**RWA Tokenizer** — платформа для фракционного владения недвижимостью на блокчейне Solana.

**Ключевая идея:** Владелец объекта подписывает документ о праве собственности через **ЭЦП НУЦ РК** (государственная электронная подпись Казахстана). Хэш подписи хранится на Solana — токены выпускаются только после проверки. Это решает проблему «proof-of-asset» без централизованного посредника.

**Пользовательский сценарий:**
1. Владелец подписывает документ через ЭЦП → хэш записывается on-chain
2. Выпускается 1 000 000 SPL токенов = 100% собственности
3. Инвесторы покупают доли через Phantom Wallet от $1
4. Вторичный рынок: P2P торговля токенами
5. Арендный доход распределяется пропорционально долям on-chain

**Запуск:**
```bash
cd scripts && npm install && npm run demo   # CLI-демо (5 фаз)
cd app && npm install && npm run dev        # Веб-интерфейс → localhost:3000
```

---

## 🇬🇧 About (English)

## The Problem

Real estate is the world's largest asset class ($326 trillion), yet it remains:
- **High-barrier** — a $450K apartment in Almaty requires the full sum upfront
- **Illiquid** — selling takes months, not minutes
- **Opaque** — ownership records are centralized, hard to verify, easy to forge
- **Inaccessible** — global investors can't access local markets

## The Solution

RWA Tokenizer lets property owners tokenize real-world assets on Solana as SPL Tokens.  
Each token = 1 fractional share of ownership. Anyone with a Phantom Wallet can invest from $1.

### Key Innovation: ЭЦП Proof-of-Asset

Property ownership is verified using **Kazakhstan's state digital signature (ЭЦП / NCA RK)** — the same infrastructure used by government services, banks, and notaries.

```
Owner signs title document via ЭЦП НУЦ РК
  → Signature hash stored on Solana (immutable, on-chain)
  → SPL Tokens issued only after hash verification
  → Any investor can verify: on-chain hash + ЭЦП = legitimate asset
```

This replaces a centralized oracle with a **government-grade cryptographic proof** — no trusted third party needed.

---

## End-to-End User Flow

```
1. TOKENIZE    Property owner uploads title doc → signs with ЭЦП → hash stored on Solana
                → 1,000,000 SPL Tokens minted (100% fractional ownership)

2. BUY         Investor connects Phantom Wallet → browses marketplace
                → buys N shares (e.g. 250,000 tokens = 25% ownership)

3. TRADE       Secondary market: investor sells shares P2P
                → SPL Token transfer → on-chain, no intermediary

4. EARN        Rental income collected → distributed pro-rata on-chain
                → 25% ownership → 25% of monthly yield in SOL/USDC
```

---

## MVP Requirements Met

| Requirement | Status |
|---|---|
| Solana blockchain | ✅ Devnet + SPL Token Program |
| Smart contract (program) | ✅ SPL Token + custom Anchor program (in progress) |
| Create / issue tokens | ✅ `tokenizeProperty()` → createMint + mintTo |
| Manage ownership / transactions | ✅ ATA creation, transfer, yield distribution |
| Basic interface | ✅ CLI demo + Next.js web app (in progress) |
| Real asset ↔ token link | ✅ ЭЦП signature hash stored on-chain |

---

## Project Structure

```
solana-rwa-tokenizer/
├── scripts/            # TypeScript CLI demo (full end-to-end flow)
│   └── src/
│       ├── demo.ts     # Orchestrator: Phase 0–5
│       ├── property.ts # tokenizeProperty() — SPL Token mint
│       ├── investors.ts# buy shares (primary market)
│       ├── marketplace.ts# P2P transfer (secondary market)
│       ├── yield.ts    # pro-rata yield distribution
│       ├── simulator.ts# in-memory mock for offline demo
│       └── display.ts  # chalk CLI rendering
│
└── app/                # Next.js 14 web dApp (in progress)
    └── src/
        ├── app/        # pages: marketplace, property detail, portfolio, tokenize
        └── components/ # PropertyCard, WalletButton, EdsVerifyBadge, BuyModal
```

---

## Run CLI Demo

```bash
cd scripts
npm install
npm run demo              # Simulation mode (always works, no SOL needed)
npm run demo -- --devnet  # Real Solana Devnet
```

**Demo output (5 phases):**
```
PHASE 0 → Wallet setup & funding
PHASE 1 → ЭЦП verification + SPL Token mint
PHASE 2 → Primary market: investors buy fractional shares
PHASE 3 → Secondary market: P2P share transfer
PHASE 4 → Yield distribution (pro-rata rental income)
PHASE 5 → Final portfolio state
```

---

## Run Web App

```bash
cd app
npm install
npm run dev   # → http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana (Devnet / Mainnet) |
| Token Standard | SPL Token (→ Token-2022 with TransferHook) |
| Smart Contract | SPL Token Program + Anchor (custom program) |
| Proof-of-Asset | Kazakhstan ЭЦП / NCA RK (SHA-256 hash on-chain) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Wallet | Phantom (@solana/wallet-adapter) |
| Scripts | @solana/web3.js, @solana/spl-token, TypeScript |

---

## Roadmap

- [x] CLI end-to-end demo (simulation + Devnet)
- [x] ЭЦП proof-of-asset integration
- [ ] Anchor custom program deployment on Devnet
- [ ] Next.js web UI with Phantom Wallet
- [ ] Token-2022 TransferHook (KYC whitelist)
- [ ] USDC yield distribution (instead of SOL)
- [ ] Real NCALayer API integration

---

## Team

National Solana Hackathon by Decentrathon — Kazakhstan

---

## License

MIT
