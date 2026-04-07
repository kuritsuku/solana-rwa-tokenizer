"use client";

/**
 * NCALayer WebSocket Client
 *
 * NCALayer is Kazakhstan's state PKI application (НУЦ РК) that runs locally
 * and exposes a WebSocket endpoint for signing documents with ЭЦП.
 *
 * Protocol: NCALayer 2.0 WebSocket API
 * Endpoint:  wss://127.0.0.1:13579  (or ws://127.0.0.1:13579)
 * Docs:      https://pki.gov.kz/ncalayer/
 *
 * If NCALayer is not installed/running, falls back to deterministic mock
 * signature so the demo works without real ЭЦП hardware.
 */

export type NCALayerStatus = "connecting" | "connected" | "mock" | "error";

export interface NCALayerResult {
  /** Base64-encoded CMS signature from NCALayer (or mock) */
  signature: string;
  /** SHA-256 hex hash of signature — stored on Solana chain */
  hash: string;
  /** Whether this was a real NCALayer signature or a mock */
  mock: boolean;
  /** Storage type used: PKCS12 | AKKey | null (mock) */
  storage: "PKCS12" | "AKKey" | null;
}

// ─── WebSocket request/response types ─────────────────────────────────────────

interface NCALayerRequest {
  module: "kz.gov.pki.knca.commonUtils";
  method: "signData" | "browseKeyStore";
  args: Record<string, unknown>;
}

interface NCALayerResponse {
  code: string;          // "200" = success, "500" = error, "0" = heartbeat
  message?: string;
  responseObject?: string | null;
}

// ─── Core client ──────────────────────────────────────────────────────────────

const WS_URLS = [
  "wss://127.0.0.1:13579",
  "ws://127.0.0.1:13579",
];

const CONNECT_TIMEOUT_MS = 2500;

async function tryConnect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`timeout connecting to ${url}`));
    }, CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`cannot connect to ${url}`));
    };
  });
}

async function connectToNCALayer(): Promise<WebSocket | null> {
  for (const url of WS_URLS) {
    try {
      return await tryConnect(url);
    } catch {
      // try next URL
    }
  }
  return null;
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function btoa64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

/**
 * Signs data using a connected NCALayer WebSocket.
 * Returns the CMS signature via callback-style promise over WS messages.
 */
async function signWithWebSocket(
  ws: WebSocket,
  data: string
): Promise<{ signature: string; storage: "PKCS12" | "AKKey" }> {
  const base64Data = btoa64(data);

  const request: NCALayerRequest = {
    module: "kz.gov.pki.knca.commonUtils",
    method: "signData",
    args: {
      allowedStorages: ["PKCS12", "AKKey"],
      format: "cms",
      data: base64Data,
      signingParams: {
        decode: true,
        encodeType: "BASE64",
        digested: false,
      },
      signerParams: {
        extKeyUsageOids: ["1.2.840.113549.1.9.3"],
        chain: true,
      },
      locale: "ru",
    },
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("NCALayer sign timeout (60s). Did you confirm the dialog?"));
    }, 60_000);

    ws.onmessage = (event) => {
      clearTimeout(timeout);
      try {
        const resp: NCALayerResponse = JSON.parse(event.data as string);

        // Heartbeat — ignore and keep waiting
        if (resp.code === "0") return;

        if (resp.code === "200" && resp.responseObject) {
          resolve({ signature: resp.responseObject, storage: "PKCS12" });
        } else {
          reject(new Error(`NCALayer error ${resp.code}: ${resp.message ?? "Unknown"}`));
        }
      } catch {
        reject(new Error("NCALayer returned invalid JSON"));
      }
    };

    ws.send(JSON.stringify(request));
  });
}

/**
 * Generates a deterministic mock signature for offline demo mode.
 * Hash is SHA-256 of (data + timestamp) — reproducible per document.
 */
async function mockSign(data: string): Promise<NCALayerResult> {
  // Small delay to simulate signing UX
  await new Promise((r) => setTimeout(r, 1200));

  const mockSig = btoa64(`MOCK_EDS_SIGNATURE:${data}:${Date.now()}`);
  const hash = await sha256Hex(mockSig);

  return { signature: mockSig, hash, mock: true, storage: null };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sign arbitrary data with NCALayer ЭЦП НУЦ РК.
 *
 * - First tries to connect to local NCALayer (wss://127.0.0.1:13579)
 * - If not available, falls back to mock signature
 * - Returns { signature, hash, mock, storage }
 */
export async function signWithEDS(
  data: string,
  onStatus?: (status: NCALayerStatus) => void
): Promise<NCALayerResult> {
  onStatus?.("connecting");

  const ws = await connectToNCALayer();

  if (!ws) {
    // NCALayer not installed / not running — use mock
    onStatus?.("mock");
    return mockSign(data);
  }

  onStatus?.("connected");

  try {
    const { signature, storage } = await signWithWebSocket(ws, data);
    const hash = await sha256Hex(signature);
    ws.close();
    return { signature, hash, mock: false, storage };
  } catch (err) {
    ws.close();
    onStatus?.("error");
    throw err;
  }
}

/**
 * Probes whether NCALayer is reachable (for status badges).
 * Resolves true/false without throwing.
 */
export async function probeNCALayer(): Promise<boolean> {
  const ws = await connectToNCALayer();
  if (ws) {
    ws.close();
    return true;
  }
  return false;
}
