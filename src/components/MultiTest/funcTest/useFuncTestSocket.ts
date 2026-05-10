// Minimal WebSocket client dedicated to the Functional Test tab.
//
// Server contract (see SimpleWebSocketServer):
//   send  { type: "botJob.getInputInstructions", sessionId, body: "{\"botJobId\":N}" }
//   recv  { type: "botJob.inputInstructions",    body: "[ ...BotJobInputField... ]" }
//
//   send  { type: "funcTest.loadMappings", sessionId, body: "{\"botJobId\":N}" }
//   recv  { type: "funcTest.mappingsLoaded", body: "[ ...PersistedFieldMapping... ]" }
//
//   send  { type: "funcTest.saveMappings", sessionId,
//           body: "{\"botJobId\":N, \"mappings\": [ ...PersistedFieldMapping... ]}" }
//   recv  { type: "funcTest.mappingsSaved", body: "{\"ok\":bool,\"count\":N,\"botJobId\":N}" }

import { useCallback, useEffect, useRef, useState } from "react";
import type { BotJobInputField } from "./types";

/** Server-side mapping row. Matches Java FieldMappingDTO field-for-field. */
export interface PersistedFieldMapping {
  id?: number;
  botJobId?: number;
  apiKey: string;
  apiSpecFile: string | null;
  apiFieldName: string | null;
  botInstructionId: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface Options {
  socketPort: number;
  sessionId: string;
}

interface State {
  connected: boolean;
  loading: boolean;          // for instructions
  loadingMappings: boolean;
  saving: boolean;
  error: string | null;
  fields: BotJobInputField[];
  persistedMappings: PersistedFieldMapping[] | null;  // null = never loaded yet
  lastSaveOk: boolean | null;
  lastSaveAt: string | null;
}

const INITIAL: State = {
  connected: false,
  loading: false,
  loadingMappings: false,
  saving: false,
  error: null,
  fields: [],
  persistedMappings: null,
  lastSaveOk: null,
  lastSaveAt: null,
};

export function useFuncTestSocket({ socketPort, sessionId }: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    if (!socketPort || !sessionId) return;
    const ws = new WebSocket(
      `ws://localhost:${socketPort}/websocket?sessionId=${encodeURIComponent(sessionId)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => setState(s => ({ ...s, connected: true, error: null }));

    ws.onmessage = ev => {
      try {
        const msg = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        const verb = msg?.type ?? msg?.operationId;
        const bodyRaw = msg?.body ?? msg?.payload ?? msg?.data;
        const parseBody = <T,>(): T | null => {
          if (Array.isArray(bodyRaw)) return bodyRaw as unknown as T;
          if (typeof bodyRaw === "object" && bodyRaw !== null) return bodyRaw as T;
          if (typeof bodyRaw === "string") {
            try { return JSON.parse(bodyRaw) as T; } catch { return null; }
          }
          return null;
        };

        if (verb === "botJob.inputInstructions") {
          const parsed = parseBody<BotJobInputField[]>() ?? [];
          setState(s => ({ ...s, loading: false, fields: parsed, error: null }));
        } else if (verb === "funcTest.mappingsLoaded") {
          const parsed = parseBody<PersistedFieldMapping[]>() ?? [];
          setState(s => ({ ...s, loadingMappings: false, persistedMappings: parsed, error: null }));
        } else if (verb === "funcTest.mappingsSaved") {
          const parsed = parseBody<{ ok: boolean; count: number; error?: string }>() ?? { ok: false, count: 0 };
          setState(s => ({
            ...s,
            saving: false,
            lastSaveOk: parsed.ok,
            lastSaveAt: new Date().toISOString(),
            error: parsed.ok ? null : parsed.error || "Save failed",
          }));
        }
      } catch (e) {
        setState(s => ({
          ...s, loading: false, loadingMappings: false, saving: false,
          error: `Failed to parse server response: ${(e as Error).message}`,
        }));
      }
    };

    ws.onerror = () =>
      setState(s => ({ ...s, error: "WebSocket connection error" }));
    ws.onclose = () => setState(s => ({ ...s, connected: false }));

    return () => {
      try { ws.close(); } catch {}
      wsRef.current = null;
    };
  }, [socketPort, sessionId]);

  const send = useCallback((payload: object): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const loadInputInstructions = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) {
      setState(s => ({ ...s, error: "No active bot job — open a bot job first.", fields: [] }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    if (!send({
      type: "botJob.getInputInstructions",
      sessionId, botJobId, body: JSON.stringify({ botJobId }),
    })) setState(s => ({ ...s, loading: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const loadMappings = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) {
      setState(s => ({ ...s, persistedMappings: [] }));
      return;
    }
    setState(s => ({ ...s, loadingMappings: true, error: null }));
    if (!send({
      type: "funcTest.loadMappings",
      sessionId, botJobId, body: JSON.stringify({ botJobId }),
    })) setState(s => ({ ...s, loadingMappings: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveMappings = useCallback((botJobId: number, mappings: PersistedFieldMapping[]) => {
    if (!botJobId || botJobId <= 0) {
      setState(s => ({ ...s, error: "No active bot job — cannot save." }));
      return;
    }
    setState(s => ({ ...s, saving: true, error: null }));
    if (!send({
      type: "funcTest.saveMappings",
      sessionId, botJobId,
      body: JSON.stringify({ botJobId, mappings }),
    })) setState(s => ({ ...s, saving: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  return { ...state, loadInputInstructions, loadMappings, saveMappings };
}
