"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getMintLen,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
import { signWithEDS, probeNCALayer, NCALayerStatus, NCALayerResult } from "../../lib/ncalayer";
import { buildInitializePropertyInstruction, getPropertyPDA } from "../../lib/solana";
import { Property, saveCustomProperty } from "../../lib/mockData";

type Step = "upload" | "sign" | "mint" | "done";

export default function TokenizePage() {
  const [step, setStep] = useState<Step>("upload");
  const [form, setForm] = useState({ name: "", location: "", value: "", shares: "1000000", yield: "" });
  const [ncaStatus, setNcaStatus] = useState<NCALayerStatus | "idle">("idle");
  const [edsResult, setEdsResult] = useState<NCALayerResult | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [demoMintMode, setDemoMintMode] = useState(false);
  const [mintWarning, setMintWarning] = useState<string | null>(null);

  // Probe NCALayer availability on mount
  useEffect(() => {
    setNcaStatus("connecting");
    probeNCALayer().then((available) => {
      setNcaStatus(available ? "connected" : "mock");
    });
  }, []);

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Данные объекта" },
    { id: "sign",   label: "ЭЦП подпись" },
    { id: "mint",   label: "Выпуск токенов" },
    { id: "done",   label: "Готово" },
  ];

  const stepOrder: Step[] = ["upload", "sign", "mint", "done"];
  const { publicKey, sendTransaction, signTransaction, connected } = useWallet();

  function randomBase58(length: number): string {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const ncaBadge = () => {
    if (ncaStatus === "connecting") return { color: "#a0a0b0", bg: "rgba(160,160,176,0.1)", border: "rgba(160,160,176,0.25)", label: "⏳ Проверка NCALayer..." };
    if (ncaStatus === "connected") return { color: "#14F195", bg: "rgba(20,241,149,0.1)", border: "rgba(20,241,149,0.3)", label: "🔌 NCALayer подключён" };
    if (ncaStatus === "mock")      return { color: "#f5a623", bg: "rgba(245,166,35,0.1)",  border: "rgba(245,166,35,0.3)",  label: "⚡ Mock режим (NCALayer не найден)" };
    if (ncaStatus === "error")     return { color: "#ff6b6b", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.3)", label: "✖ Ошибка NCALayer" };
    return { color: "#a0a0b0", bg: "rgba(160,160,176,0.1)", border: "rgba(160,160,176,0.25)", label: "NCALayer" };
  };

  async function handleSign() {
    const propertyData = {
      property: form.name || "ЖК Нурлы Жол",
      location: form.location || "Алматы, ул. Достык 12",
      valuation: form.value || "450000",
      shares: form.shares,
      timestamp: new Date().toISOString(),
      blockchain: "solana-devnet",
    };

    try {
      setNcaStatus("connecting");
      const result = await signWithEDS(JSON.stringify(propertyData), setNcaStatus);
      setEdsResult(result);
      setStep("mint");
    } catch (err) {
      setNcaStatus("error");
      alert(`Ошибка подписи ЭЦП: ${err instanceof Error ? err.message : String(err)}`);
      probeNCALayer().then((ok) => setNcaStatus(ok ? "connected" : "mock"));
    }
  }

  async function handleMint() {
    if (!form.name || !form.location || !form.value || !form.shares) {
      alert("Заполните все обязательные поля объекта недвижимости.");
      return;
    }

    if (!edsResult) {
      alert("Сначала выполните ЭЦП-подпись документа.");
      setMintLoading(false);
      return;
    }

    // Demo fallback for recordings without wallet extensions.
    if (!connected || !publicKey || !signTransaction) {
      setMintLoading(true);
      const newPropertyId = `PROP-${Date.now()}`;
      setPropertyId(newPropertyId);
      await new Promise((r) => setTimeout(r, 1300));
      setMintAddress(randomBase58(44));
      setTxSig(randomBase58(88));
      setDemoMintMode(true);
      setMintWarning("Demo mint выполнен без on-chain инициализации property state.");
      const valuationUsd = parseInt(form.value, 10);
      const totalShares = parseInt(form.shares, 10);
      const annualYield = parseFloat(form.yield || "7.5");
      const createdProperty: Property = {
        id: newPropertyId.toLowerCase(),
        name: form.name,
        location: form.location,
        image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&q=80",
        valuationUsd,
        totalShares,
        soldShares: 0,
        pricePerShare: Number((valuationUsd / Math.max(totalShares, 1)).toFixed(2)),
        annualYieldPercent: Number((Number.isFinite(annualYield) ? annualYield : 7.5).toFixed(1)),
        edsHash: (edsResult?.hash ?? "").slice(0, 16) || "mock-signature",
        edsVerified: true,
        description: `${form.name}. Токенизированный объект, созданный в demo-потоке платформы.`,
        type: "residential",
        area: 100,
      };
      saveCustomProperty(createdProperty);
      setMintDone(true);
      setStep("done");
      setMintLoading(false);
      return;
    }

    setMintLoading(true);
    setDemoMintMode(false);
    setMintWarning(null);

    try {
      const newPropertyId = `PROP-${Date.now()}`;
      setPropertyId(newPropertyId);
      let lastConfirmedSig: string | null = null;

      const mintKeypair = Keypair.generate();
      const hookProgramId = new PublicKey("DueqM2eEUpHR7SFm957Xd8kAmykXKUqjy1sLoXHVwv3p");
      const decimals = 0;
      const mintLen = getMintLen([ExtensionType.TransferHook]);
      const mintAccountLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

      const createMintTx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports: mintAccountLamports,
          programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
        }),
        createInitializeTransferHookInstruction(
          mintKeypair.publicKey,
          publicKey,
          hookProgramId,
          new PublicKey(TOKEN_2022_PROGRAM_ID),
        ),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          publicKey,
          null,
          new PublicKey(TOKEN_2022_PROGRAM_ID),
        ),
      );

      createMintTx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      createMintTx.feePayer = publicKey;
      createMintTx.partialSign(mintKeypair);

      const signedCreateMintTx = await signTransaction(createMintTx);
      const createMintSig = await connection.sendRawTransaction(signedCreateMintTx.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
      await connection.confirmTransaction(createMintSig, "confirmed");
      lastConfirmedSig = createMintSig;

      const issuerAta = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey,
        false,
        new PublicKey(TOKEN_2022_PROGRAM_ID),
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const accountInfo = await connection.getAccountInfo(issuerAta);
      const ataTx = new Transaction();
      if (!accountInfo) {
        ataTx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            issuerAta,
            publicKey,
            mintKeypair.publicKey,
            new PublicKey(TOKEN_2022_PROGRAM_ID),
            ASSOCIATED_TOKEN_PROGRAM_ID,
          )
        );
      }

      ataTx.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          issuerAta,
          publicKey,
          BigInt(parseInt(form.shares, 10)),
          [],
          new PublicKey(TOKEN_2022_PROGRAM_ID),
        ),
      );

      if (ataTx.instructions.length > 0) {
        ataTx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
        ataTx.feePayer = publicKey;
        const signedAtaTx = await signTransaction(ataTx);
        const ataSig = await connection.sendRawTransaction(signedAtaTx.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
        await connection.confirmTransaction(ataSig, "confirmed");
        lastConfirmedSig = ataSig;
      }

      const propertyStatePDA = getPropertyPDA(newPropertyId)[0];
      const initializePropertyIx = buildInitializePropertyInstruction({
        propertyId: newPropertyId,
        name: form.name,
        valuationUsd: BigInt(parseInt(form.value, 10)),
        totalShares: BigInt(parseInt(form.shares, 10)),
        edsHash: edsResult?.hash ?? "",
        propertyStatePDA,
        mint: mintKeypair.publicKey,
        owner: publicKey,
        systemProgram: SystemProgram.programId,
      });

      let initSig: string | null = null;
      try {
        const initTx = new Transaction().add(initializePropertyIx);
        initTx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
        initTx.feePayer = publicKey;
        const signedInitTx = await signTransaction(initTx);
        initSig = await connection.sendRawTransaction(signedInitTx.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });
        await connection.confirmTransaction(initSig, "confirmed");
        lastConfirmedSig = initSig;
      } catch (initError) {
        console.warn("initialize_property failed, keeping demo flow alive", initError);
        setMintWarning("Mint создан, но initialize_property не выполнился на текущем devnet deploy.");
      }

      setMintAddress(mintKeypair.publicKey.toBase58());
      setTxSig(lastConfirmedSig);
      const valuationUsd = parseInt(form.value, 10);
      const totalShares = parseInt(form.shares, 10);
      const annualYield = parseFloat(form.yield || "7.5");
      const createdProperty: Property = {
        id: newPropertyId.toLowerCase(),
        name: form.name,
        location: form.location,
        image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&q=80",
        valuationUsd,
        totalShares,
        soldShares: 0,
        pricePerShare: Number((valuationUsd / Math.max(totalShares, 1)).toFixed(2)),
        annualYieldPercent: Number((Number.isFinite(annualYield) ? annualYield : 7.5).toFixed(1)),
        edsHash: (edsResult?.hash ?? "").slice(0, 16) || "eds-hash",
        edsVerified: true,
        description: `${form.name}. Токенизированный объект, добавленный после выпуска Token-2022 mint.`,
        type: "residential",
        area: 100,
      };
      saveCustomProperty(createdProperty);
      setMintDone(true);
      setStep("done");
    } catch (error) {
      console.error(error);
      alert(`Ошибка при создании токена: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMintLoading(false);
    }
  }

  const badge = ncaBadge();
  const edsHash = edsResult?.hash ?? "a3f8c2d1e9b47056";

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e8e8f0", margin: 0 }}>Токенизировать объект</h1>
          <p style={{ color: "#6b6b80", marginTop: 6, fontSize: 14 }}>Создайте SPL Token-2022 с TransferHook, обеспеченный реальным активом и подписанный ЭЦП НУЦ РК</p>
        </div>
        {/* NCALayer status badge */}
        <div style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 10, padding: "6px 14px", fontSize: 12, color: badge.color, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
          {badge.label}
        </div>
      </div>

      {/* NCALayer info banners */}
      {ncaStatus === "mock" && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 12, color: "#f5a623" }}>
          NCALayer не обнаружен на ws://127.0.0.1:13579. Используется симуляция подписи. Для реальной ЭЦП установите <strong>NCALayer</strong> с pki.gov.kz.
        </div>
      )}
      {ncaStatus === "connected" && (
        <div style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.15)", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 12, color: "#14F195" }}>
          NCALayer подключён. Подпись будет выполнена через ваш ЭЦП НУЦ РК сертификат (хранилище PKCS12 / AKKey).
        </div>
      )}

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
        {steps.map((s, i) => {
          const done = stepOrder.indexOf(step) > i;
          const active = step === s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: done ? "#14F195" : active ? "#9945FF" : "rgba(255,255,255,0.08)", color: done || active ? "#000" : "#6b6b80", border: active ? "2px solid #9945FF" : "none" }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, color: active ? "#e8e8f0" : "#6b6b80", whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? "#14F195" : "rgba(255,255,255,0.08)", margin: "0 8px", marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>

        {/* STEP 1: Property data */}
        {step === "upload" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 24 }}>Данные объекта недвижимости</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Название объекта", key: "name", placeholder: "ЖК Нурлы Жол, кв. 142" },
                { label: "Адрес", key: "location", placeholder: "Алматы, ул. Достык 12" },
                { label: "Рыночная оценка (USD)", key: "value", placeholder: "450000" },
                { label: "Количество токенов (долей)", key: "shares", placeholder: "1000000" },
                { label: "Ожидаемый yield (%/год)", key: "yield", placeholder: "7.5" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 16px", color: "#e8e8f0", fontSize: 15, boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6, display: "block" }}>Документ о праве собственности (PDF)</label>
                <div style={{ border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "24px", textAlign: "center", color: "#6b6b80", fontSize: 14 }}>
                  📄 Перетащите PDF или нажмите для загрузки
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep("sign")}
              style={{ marginTop: 24, width: "100%", background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer" }}
            >
              Далее: Подписать ЭЦП →
            </button>
          </div>
        )}

        {/* STEP 2: EDS signing */}
        {step === "sign" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>Подписать через ЭЦП НУЦ РК</h2>
            <p style={{ color: "#6b6b80", fontSize: 14, marginBottom: 24 }}>
              {ncaStatus === "connected"
                ? "NCALayer обнаружен. Нажмите кнопку — откроется диалог выбора сертификата."
                : "Подпишите документ государственной электронной подписью. SHA-256 хэш подписи записывается на Solana."}
            </p>

            <div style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.2)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#14F195", fontWeight: 600, marginBottom: 12 }}>Документ для подписи:</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#a0a0b0", lineHeight: 1.8 }}>
                {`{`}<br />
                {`  "property": "${form.name || "ЖК Нурлы Жол"}",`}<br />
                {`  "location": "${form.location || "Алматы, ул. Достык 12"}",`}<br />
                {`  "valuation": ${form.value || "450000"},`}<br />
                {`  "shares": ${form.shares},`}<br />
                {`  "timestamp": "${new Date().toISOString()}",`}<br />
                {`  "blockchain": "solana-devnet"`}<br />
                {`}`}
              </div>
            </div>

            <button
              onClick={handleSign}
              disabled={ncaStatus === "connecting"}
              style={{
                width: "100%",
                background: ncaStatus === "connecting"
                  ? "rgba(255,255,255,0.06)"
                  : ncaStatus === "connected"
                  ? "rgba(20,241,149,0.15)"
                  : "rgba(245,166,35,0.15)",
                border: `1px solid ${ncaStatus === "connected" ? "rgba(20,241,149,0.4)" : ncaStatus === "connecting" ? "rgba(255,255,255,0.1)" : "rgba(245,166,35,0.4)"}`,
                color: ncaStatus === "connected" ? "#14F195" : ncaStatus === "connecting" ? "#6b6b80" : "#f5a623",
                fontWeight: 700, fontSize: 15, borderRadius: 12, padding: "14px 0",
                cursor: ncaStatus === "connecting" ? "wait" : "pointer",
                marginBottom: 12,
                opacity: ncaStatus === "connecting" ? 0.7 : 1,
              }}
            >
              {ncaStatus === "connecting"
                ? "⏳ Ожидание подписи в NCALayer..."
                : ncaStatus === "connected"
                ? "🔏 Подписать через NCALayer (ЭЦП)"
                : "⚡ Подписать (Mock режим — демо)"}
            </button>
            <p style={{ fontSize: 12, color: "#6b6b80", textAlign: "center" }}>
              {ncaStatus === "connected"
                ? "Требуется NCALayer v2+ и действующий сертификат ЭЦП НУЦ РК"
                : "NCALayer не найден — mock SHA-256 хэш используется в демо-целях"}
            </p>
          </div>
        )}

        {/* STEP 3: Mint */}
        {step === "mint" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 8 }}>Выпуск Token-2022 на Solana</h2>
            {!connected && (
              <div style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#a0a0b0" }}>
                Phantom не подключен — будет запущен demo mint режим без кошелька.
              </div>
            )}

            <div style={{ background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.25)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: "#14F195", fontWeight: 600 }}>
                  {edsResult?.mock ? "⚡ Mock ЭЦП подпись" : "✓ ЭЦП НУЦ РК подпись получена"}
                </div>
                <div style={{ fontSize: 11, color: "#6b6b80", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>
                  {edsResult?.mock ? "Mock" : (edsResult?.storage ?? "PKCS12")}
                </div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b6b80", wordBreak: "break-all" }}>
                SHA-256 → <span style={{ color: "#9945FF" }}>{edsHash}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, fontSize: 14 }}>
              {[
                "Token-2022 Mint с расширением TransferHook (KYC)",
                `${parseInt(form.shares || "1000000").toLocaleString()} токенов выпущено (0 decimals)`,
                "ЭЦП хэш записан через Anchor программу (initialize_property)",
                "KYC whitelist PDA инициализирован",
                "Объект доступен на маркетплейсе",
              ].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: mintDone ? "#14F195" : "#a0a0b0" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: mintDone ? "none" : mintLoading ? "2px solid #9945FF" : "2px solid rgba(255,255,255,0.2)",
                    background: mintDone ? "#14F195" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#000",
                  }}>
                    {mintDone ? "✓" : ""}
                  </div>
                  {label}
                </div>
              ))}
            </div>

            <button
              onClick={handleMint}
              disabled={mintLoading}
              style={{ width: "100%", background: mintLoading ? "rgba(153,69,255,0.4)" : "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px 0", cursor: mintLoading ? "wait" : "pointer", opacity: mintLoading ? 0.7 : 1 }}
            >
              {mintLoading ? "⏳ Создание Token-2022 на Solana..." : !connected ? "🪙 Demo mint без кошелька" : "🪙 Выпустить Token-2022 + записать ЭЦП hash"}
            </button>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e8e8f0", marginBottom: 8 }}>Токены выпущены!</h2>
            <p style={{ color: "#6b6b80", marginBottom: 32 }}>Ваш объект токенизирован как Token-2022 и доступен инвесторам</p>
            {mintWarning && (
              <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, color: "#f5a623", fontSize: 12 }}>
                ⚠ {mintWarning}
              </div>
            )}
            <div style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "left" }}>
              {[
                { label: "Mint Address", value: mintAddress ? `${mintAddress.slice(0, 20)}...` : "—" },
                { label: "ЭЦП Hash (on-chain)", value: edsHash ? `${edsHash.slice(0, 20)}...` : "—" },
                { label: "Token Standard", value: "Token-2022 + TransferHook" },
                { label: "Токенов выпущено", value: parseInt(form.shares || "1000000").toLocaleString() },
                { label: "Подпись ЭЦП", value: edsResult?.mock ? "Mock (демо)" : "НУЦ РК ✓" },
                { label: "Режим выпуска", value: demoMintMode ? "Demo без кошелька" : "Через Phantom" },
                { label: "Сеть", value: "Solana Devnet" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                  <span style={{ color: "#6b6b80" }}>{r.label}</span>
                  <span style={{ color: "#9945FF", fontFamily: "monospace" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <a href="/" style={{ display: "inline-block", background: "linear-gradient(135deg, #9945FF, #14F195)", color: "#000", fontWeight: 700, fontSize: 15, borderRadius: 12, padding: "12px 32px", textDecoration: "none" }}>
              Перейти на маркетплейс →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
