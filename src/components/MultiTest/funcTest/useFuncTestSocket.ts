// Minimal WebSocket client dedicated to the Functional Test tab.
//
// Server contract (see SimpleWebSocketServer):
//   send  { type: "botJob.getInputInstructions", sessionId, body: "{\"botJobId\":N}" }
//   recv  { type: "botJob.inputInstructions",    body: "[ ...BotJobInputField... ]" }
//
//   send  { type: "funcTest.loadMappings", sessionId,
//           body: "{\"useCaseId\":U}" | "{\"botJobId\":N}" }
//   recv  { type: "funcTest.mappingsLoaded", body: "[ ...PersistedFieldMapping... ]" }
//
//   send  { type: "funcTest.saveMappings", sessionId,
//           body: "{\"botJobId\":N, \"useCaseId\":U, \"mappings\": [ ... ]}" }
//   recv  { type: "funcTest.mappingsSaved", body: "{\"ok\":bool,\"count\":N,\"botJobId\":N,\"useCaseId\":U}" }
//
//   send  { type: "useCase.list", sessionId, body: "{\"botJobId\":N}" }
//   recv  { type: "useCase.listResponse", body: "[ ...UseCase... ]" }
//
//   send  { type: "useCase.save", sessionId,
//           body: "{\"useCase\": {...UseCase or partial...}}" }
//   recv  { type: "useCase.saveResponse", body: "{\"ok\":bool,\"id\":N,\"useCase\":{...}}" }
//
//   send  { type: "useCase.delete", sessionId, body: "{\"useCaseId\":U}" }
//   recv  { type: "useCase.deleteResponse", body: "{\"ok\":bool,\"useCaseId\":U}" }

import { useCallback, useEffect, useRef, useState } from "react";
import type { BotJobInputField, UseCase } from "./types";

/** Server-side mapping row. Matches Java FieldMappingDTO field-for-field. */
export interface PersistedFieldMapping {
  id?: number;
  botJobId?: number;
  useCaseId?: number | null;   // Phase 1a (ROADMAP_9)
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
  loadingUseCases: boolean;
  saving: boolean;
  savingUseCase: boolean;
  error: string | null;
  fields: BotJobInputField[];
  persistedMappings: PersistedFieldMapping[] | null;  // null = never loaded yet
  lastSaveOk: boolean | null;
  lastSaveAt: string | null;
  useCases: UseCase[];
  lastUseCaseSaveOk: boolean | null;
  lastUseCaseSaveAt: string | null;
  lastUseCaseSaved: UseCase | null;       // the freshly-created or renamed one
  lastUseCaseDeletedId: number | null;
}

const INITIAL: State = {
  connected: false,
  loading: false,
  loadingMappings: false,
  loadingUseCases: false,
  saving: false,
  savingUseCase: false,
  error: null,
  fields: [],
  persistedMappings: null,
  lastSaveOk: null,
  lastSaveAt: null,
  useCases: [],
  lastUseCaseSaveOk: null,
  lastUseCaseSaveAt: null,
  lastUseCaseSaved: null,
  lastUseCaseDeletedId: null,
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
        } else if (verb === "useCase.listResponse") {
          const parsed = parseBody<UseCase[]>() ?? [];
          setState(s => ({ ...s, loadingUseCases: false, useCases: parsed, error: null }));
        } else if (verb === "useCase.saveResponse") {
          const parsed = parseBody<{ ok: boolean; id?: number; useCase?: UseCase; error?: string }>()
            ?? { ok: false };
          setState(s => ({
            ...s,
            savingUseCase: false,
            lastUseCaseSaveOk: parsed.ok,
            lastUseCaseSaveAt: new Date().toISOString(),
            lastUseCaseSaved: parsed.useCase ?? null,
            error: parsed.ok ? null : parsed.error || "Use case save failed",
          }));
        } else if (verb === "useCase.deleteResponse") {
          const parsed = parseBody<{ ok: boolean; useCaseId?: number; error?: string }>() ?? { ok: false };
          setState(s => ({
            ...s,
            lastUseCaseDeletedId: parsed.ok ? (parsed.useCaseId ?? null) : null,
            error: parsed.ok ? null : parsed.error || "Use case delete failed",
          }));
        }
      } catch (e) {
        setState(s => ({
          ...s, loading: false, loadingMappings: false, saving: false,
          loadingUseCases: false, savingUseCase: false,
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

  // ── Bot job instructions ────────────────────────────────────────────────
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

  // ── Use case CRUD ───────────────────────────────────────────────────────
  const loadUseCases = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) {
      setState(s => ({ ...s, useCases: [] }));
      return;
    }
    setState(s => ({ ...s, loadingUseCases: true, error: null }));
    if (!send({
      type: "useCase.list",
      sessionId, botJobId, body: JSON.stringify({ botJobId }),
    })) setState(s => ({ ...s, loadingUseCases: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveUseCase = useCallback((useCase: Partial<UseCase> & { botJobId: number; name: string }) => {
    setState(s => ({ ...s, savingUseCase: true, lastUseCaseSaved: null, error: null }));
    if (!send({
      type: "useCase.save",
      sessionId, body: JSON.stringify({ useCase }),
    })) setState(s => ({ ...s, savingUseCase: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const deleteUseCase = useCallback((useCaseId: number) => {
    if (!useCaseId || useCaseId <= 0) return;
    setState(s => ({ ...s, lastUseCaseDeletedId: null, error: null }));
    if (!send({
      type: "useCase.delete",
      sessionId, body: JSON.stringify({ useCaseId }),
    })) setState(s => ({ ...s, error: "Socket not connected." }));
  }, [send, sessionId]);

  // ── Mappings (now scoped to a use case) ─────────────────────────────────
  const loadMappings = useCallback((useCaseId: number) => {
    if (!useCaseId || useCaseId <= 0) {
      setState(s => ({ ...s, persistedMappings: [] }));
      return;
    }
    setState(s => ({ ...s, loadingMappings: true, persistedMappings: null, error: null }));
    if (!send({
      type: "funcTest.loadMappings",
      sessionId, body: JSON.stringify({ useCaseId }),
    })) setState(s => ({ ...s, loadingMappings: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveMappings = useCallback(
    (botJobId: number, useCaseId: number, mappings: PersistedFieldMapping[]) => {
      if (!botJobId || botJobId <= 0 || !useCaseId || useCaseId <= 0) {
        setState(s => ({ ...s, error: "Need an active bot job + use case to save." }));
        return;
      }
      setState(s => ({ ...s, saving: true, error: null }));
      if (!send({
        type: "funcTest.saveMappings",
        sessionId,
        body: JSON.stringify({ botJobId, useCaseId, mappings }),
      })) setState(s => ({ ...s, saving: false, error: "Socket not connected." }));
    },
    [send, sessionId],
  );

  return {
    ...state,
    loadInputInstructions,
    loadUseCases, saveUseCase, deleteUseCase,
    loadMappings, saveMappings,
  };
}
