# 🏠 Solana RWA Tokenizer

[![Live Demo](https://img.shields.io/badge/Live%20Demo-solana--rwa--tokenizer.vercel.app-14F195?logo=vercel)](https://solana-rwa-tokenizer.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> **RWA Tokenizer** позволяет токенизировать недвижимость на Solana и подтвердить ownership через государственную ЭЦП НУЦ РК.

---

## 🌐 Live Demo

**→ https://solana-rwa-tokenizer.vercel.app**

---

## О проекте

RWA Tokenizer — это децентрализованная платформа для дробного инвестирования в реальные активы.

Владелец оформляет право собственности и подписывает документ через **ЭЦП НУЦ РК**. Хэш ЭЦП сохраняется на Solana, после чего выпускается Token-2022 mint с TransferHook и продаются доли.

### Как это работает
- Подписывается документ real estate title через ЭЦП НУЦ РК
- Хэш подписи записывается в программу Anchor на Solana
- Выпускается SPL Token-2022, представляющий доли объекта
- Инвесторы покупают доли через Phantom Wallet
- Вторичные переводы проходят через KYC whitelist TransferHook
- Доход распределяется пропорционально долям on-chain

---

## Архитектура

```
[User Wallet] → [Next.js dApp] → [Solana Devnet]
                               ├─ Anchor program `rwa-tokenizer`
                               └─ TransferHook program `transfer-hook`
```

---

## Структура репозитория

```
solana-rwa-tokenizer/
├── app/                # Next.js frontend
│   ├── app/            # pages: marketplace, property, portfolio, tokenize
│   ├── components/     # wallet + UI components
│   └── lib/            # Solana helpers, NCALayer integration
├── program/            # Anchor programs
│   ├── programs/
│   │   ├── rwa-tokenizer/     # property initialization, buy_shares, yield
│   │   └── transfer-hook/     # KYC whitelist transfer hook
│   └── Anchor.toml
└── scripts/            # CLI demo and simulation
    └── src/
        ├── demo.ts
        ├── property.ts
        ├── investors.ts
        ├── marketplace.ts
        ├── yield.ts
        └── simulator.ts
```

---

## Технологии

| Слой | Технология |
|---|---|
| Blockchain | Solana Devnet |
| Token Standard | Token-2022 + TransferHook |
| Smart Contract | Anchor, Rust |
| Frontend | Next.js, React, TypeScript |
| Wallet | Phantom + @solana/wallet-adapter |
| Scripts | @solana/web3.js, @solana/spl-token |
| Proof-of-Asset | Казахстанская ЭЦП НУЦ РК |

---

## Как запустить

### Запустить demo

```bash
cd scripts
npm install
npm run demo
```

### Запустить веб-приложение

```bash
cd app
npm install
npm run dev
```

Открой `http://localhost:3000` и подключи Phantom Wallet.

---

## Статус

- [x] CLI demo для tokenization и инвестиций
- [x] ЭЦП НУЦ РК proof-of-asset интеграция
- [x] Anchor программа `program/programs/rwa-tokenizer`
- [x] TransferHook KYC whitelist `program/programs/transfer-hook`
- [x] Next.js frontend demo
- [ ] Полная on-chain интеграция mint из UI
- [ ] Mainnet deployment
- [ ] UX вторичных продаж и управляемого yield

---

## License

MIT
