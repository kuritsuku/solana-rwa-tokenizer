# Figma Insert Pack — Solana RWA Tokenizer (RU, Hackathon Jury)

Ниже готовый текст для прямой вставки в ваш шаблон (11 слайдов).
Формат: `Slide text` (на слайд) + `Speaker notes` (1-2 фразы для устного питча).

## 1) Company name
**Slide text**
- **Solana RWA Tokenizer**
- Токенизация недвижимости Казахстана с on-chain proof через ЭЦП НУЦ РК.
- Demo: solana-rwa-tokenizer.vercel.app

**Speaker notes**
Мы делаем мост между реальным недвижимым активом и on-chain оборотом долей.  
Ключевая ценность: юридически значимый документ подтверждается ЭЦП, а его хэш фиксируется в блокчейне.

---

## 2) Market
**Slide text**
- **Current market:** дробное инвестирование в недвижимость фрагментировано, ownership и процессы часто оффчейн.
- **Predicted market:** токенизация переходит из пилотов к инфраструктуре институтов.
- **Validation sources:** BIS (2025), World Bank (2025), McKinsey (2024/2025).

**Speaker notes**
Мы не заявляем спорные TAM-цифры на этом этапе.  
Опираемся на тренд: крупные институты уже внедряют токенизированные процессы и инфраструктуру.

---

## 3) User insights
**Slide text**
- **Кто пользователи:** владельцы объектов, розничные инвесторы, операторы/администраторы платформы.
- **Паттерны:** нужен низкий порог входа, прозрачный ownership, простой wallet-flow.
- **Факт из пилота:** ключевой барьер не UX покупки, а доверие к подтверждению актива и комплаенс-потоку.

**Speaker notes**
Пользователь готов к Web3-операциям, если видит понятную связь с реальным активом.  
Поэтому мы строим продукт вокруг proof-of-asset и прозрачной истории операций.

---

## 4) Problem
**Slide text**
- Вход в недвижимость для частного инвестора дорогой и медленный.
- Ownership и подтверждение документов часто остаются вне блокчейна.
- Доход и вторичный оборот долей непрозрачны и с высокими операционными издержками.

**Speaker notes**
Проблема не только в ликвидности, но и в доверии.  
Если доказательство актива и поток операций не связаны в одной системе, масштабирование ограничено.

---

## 5) Solution
**Slide text**
- Токенизируем объект в доли на Solana (Token-2022).
- Хэш ЭЦП НУЦ РК сохраняем on-chain как proof-of-asset.
- Даем прозрачный поток: выпуск -> покупка -> перевод долей -> распределение yield.

**Speaker notes**
Наше решение зеркалит проблемные точки: вход, доверие, прозрачность.  
Мы уже собрали работающий end-to-end devnet flow и показываем его в демо.

---

## 6) Tech overview
**Slide text**
- **dApp:** Next.js + TypeScript + Phantom wallet.
- **On-chain:** Anchor программы `rwa-tokenizer` и `transfer-hook`.
- **Token layer:** SPL Token-2022, KYC whitelist через TransferHook (в production-compatible deploy).

**Speaker notes**
Архитектура модульная: UI, business logic on-chain и token policy разделены.  
Это упрощает аудит, эволюцию комплаенса и переход к mainnet.

---

## 7) Competitors
**Slide text**
| Категория | Слабое место | Наш плюс |
|---|---|---|
| Крауд/долевые платформы | Ключевые шаги оффчейн | On-chain lifecycle |
| REIT/фонды | Нет прямой доли в объекте | Доля по конкретному активу |
| Global RWA | Слабая локализация под KZ | ЭЦП НУЦ РК + local focus |

**Speaker notes**
Мы конкурируем не только за “инвестиционный интерфейс”, но и за доверие к происхождению актива.  
Локальная интеграция ЭЦП и целевой рынок KZ - наш основной дифференциатор.

---

## 8) Current stage
**Slide text**
- Готово: tokenization + primary + secondary flow в devnet (CLI + web demo).
- Готово: фиксация ЭЦП hash в on-chain state.
- Next: production-compatible TransferHook `execute` deploy и стабильный yield UX.
- Ссылки: demo + GitHub репозиторий.

**Speaker notes**
Мы честно разделяем то, что уже работает, и то, что требует следующего шага.  
Критичный milestone: совместимый deploy TransferHook для полного policy-enforced потока.

---

## 9) Team
**Slide text**
- **Product & Strategy:** сценарий токенизации, пользовательские потоки, roadmap.
- **Solana / Smart Contracts:** Anchor логика, Token-2022, transfer policies.
- **Frontend / Integration:** dApp UX, wallet flow, demo and deployment.

**Speaker notes**
Команда закрывает полный цикл: продукт, протокол, интерфейс.  
Фокус текущего этапа - быстрое подтверждение гипотез через работающий прототип.

---

## 10) Contacts
**Slide text**
- Demo: https://solana-rwa-tokenizer.vercel.app
- GitHub: https://github.com/kuritsuku/solana-rwa-tokenizer
- Telegram: @your_telegram_handle

**Speaker notes**
Если нужен live walkthrough, показываем сценарий прямо на devnet.  
Telegram-ник замените на финальный перед подачей.

---

## 11) Useful tips (appendix / internal)
**Slide text**
- Этот слайд не использовать в финальной подаче жюри.
- Оставить как internal checklist для репетиции.
- Главный принцип deck: минимум текста, максимум проверяемых фактов.

**Speaker notes**
Рекомендуется скрыть этот слайд перед финальным экспортом.  
Он полезен только как служебный reminder для команды.

---

## Sources for Market Slide
- BIS (24 Jun 2025): Next-generation monetary and financial system based on tokenised unified ledger  
  https://www.bis.org/press/p250624.htm
- BIS (10 Apr 2025): Leveraging tokenisation for payments and financial transactions  
  https://www.bis.org/publ/othp92.htm
- World Bank Group (29 Sep 2025): blockchain-based funds traceability rollout (`FundsChain`)  
  https://www.worldbank.org/en/news/press-release/2025/09/26/world-bank-group-tracks-project-funds-with-new-blockchain-tool
- McKinsey (2024/2025): Tokenized financial assets: from pilot to scale  
  https://www.mckinsey.com/industries/financial-services/our-insights/from-ripples-to-waves-the-transformational-power-of-tokenizing-assets

## Final QA Checklist (before export)
- Все placeholder-блоки шаблона заполнены.
- На каждом слайде 1 мысль + 2-4 коротких пункта.
- Нет неподтвержденных TAM/доходных прогнозов.
- `Current stage` отражает реальный статус: что готово и что next.
- Слайд `Useful tips` исключен из финальной версии для жюри.
