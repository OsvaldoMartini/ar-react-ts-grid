// WebSocket client for the Flow tab. Mirrors the useFuncTestSocket pattern
// (one connection per tab mount, unique session id, verb-routed responses).
//
// Server contract (see SimpleWebSocketServer):
//   send  flow.list         body: {botJobId}
//   recv  flow.listResponse body: [Flow...]
//
//   send  flow.save         body: {flow: {...Flow...}}     id null = create, set = rename
//   recv  flow.saveResponse body: {ok, id, flow}
//
//   send  flow.delete       body: {flowId}
//   recv  flow.deleteResponse body: {ok, flowId}
//
//   send  flow.steps.load   body: {flowId}
//   recv  flow.stepsLoaded  body: [FlowStep...]
//
//   send  flow.steps.save   body: {flowId, steps: [...FlowStep...]}
//   recv  flow.stepsSaved   body: {ok, count, flowId}

import { useCallback, useEffect, useRef, useState } from "react";
import type { Flow, FlowStep } from "./types";

interface Options {
  socketPort: number;
  sessionId: string;
}

interface State {
  connected: boolean;
  loadingFlows: boolean;
  savingFlow: boolean;
  loadingSteps: boolean;
  savingSteps: boolean;
  error: string | null;
  flows: Flow[];
  steps: FlowStep[] | null;            // null = never loaded for current flow yet
  lastFlowSaveOk: boolean | null;
  lastFlowSaveAt: string | null;
  lastFlowSaved: Flow | null;
  lastFlowDeletedId: number | null;
  lastStepsSaveOk: boolean | null;
  lastStepsSaveAt: string | null;
}

const INITIAL: State = {
  connected: false,
  loadingFlows: false,
  savingFlow: false,
  loadingSteps: false,
  savingSteps: false,
  error: null,
  flows: [],
  steps: null,
  lastFlowSaveOk: null,
  lastFlowSaveAt: null,
  lastFlowSaved: null,
  lastFlowDeletedId: null,
  lastStepsSaveOk: null,
  lastStepsSaveAt: null,
};

export function useFlowSocket({ socketPort, sessionId }: Options) {
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

        if (verb === "flow.listResponse") {
          const parsed = parseBody<Flow[]>() ?? [];
          setState(s => ({ ...s, loadingFlows: false, flows: parsed, error: null }));
        } else if (verb === "flow.saveResponse") {
          const parsed = parseBody<{ ok: boolean; id?: number; flow?: Flow; error?: string }>()
            ?? { ok: false };
          setState(s => ({
            ...s,
            savingFlow: false,
            lastFlowSaveOk: parsed.ok,
            lastFlowSaveAt: new Date().toISOString(),
            lastFlowSaved: parsed.flow ?? null,
            error: parsed.ok ? null : parsed.error || "Flow save failed",
          }));
        } else if (verb === "flow.deleteResponse") {
          const parsed = parseBody<{ ok: boolean; flowId?: number; error?: string }>() ?? { ok: false };
          setState(s => ({
            ...s,
            lastFlowDeletedId: parsed.ok ? (parsed.flowId ?? null) : null,
            error: parsed.ok ? null : parsed.error || "Flow delete failed",
          }));
        } else if (verb === "flow.stepsLoaded") {
          const parsed = parseBody<FlowStep[]>() ?? [];
          setState(s => ({ ...s, loadingSteps: false, steps: parsed, error: null }));
        } else if (verb === "flow.stepsSaved") {
          const parsed = parseBody<{ ok: boolean; count?: number; flowId?: number; error?: string }>()
            ?? { ok: false };
          setState(s => ({
            ...s,
            savingSteps: false,
            lastStepsSaveOk: parsed.ok,
            lastStepsSaveAt: new Date().toISOString(),
            error: parsed.ok ? null : parsed.error || "Steps save failed",
          }));
        }
      } catch (e) {
        setState(s => ({
          ...s, loadingFlows: false, savingFlow: false, loadingSteps: false, savingSteps: false,
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

  const loadFlows = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) {
      setState(s => ({ ...s, flows: [] }));
      return;
    }
    setState(s => ({ ...s, loadingFlows: true, error: null }));
    if (!send({
      type: "flow.list",
      sessionId, botJobId, body: JSON.stringify({ botJobId }),
    })) setState(s => ({ ...s, loadingFlows: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveFlow = useCallback((flow: Partial<Flow> & { botJobId: number; name: string }) => {
    setState(s => ({ ...s, savingFlow: true, lastFlowSaved: null, error: null }));
    if (!send({
      type: "flow.save",
      sessionId, body: JSON.stringify({ flow }),
    })) setState(s => ({ ...s, savingFlow: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const deleteFlow = useCallback((flowId: number) => {
    if (!flowId || flowId <= 0) return;
    setState(s => ({ ...s, lastFlowDeletedId: null, error: null }));
    if (!send({
      type: "flow.delete",
      sessionId, body: JSON.stringify({ flowId }),
    })) setState(s => ({ ...s, error: "Socket not connected." }));
  }, [send, sessionId]);

  const loadSteps = useCallback((flowId: number) => {
    if (!flowId || flowId <= 0) {
      setState(s => ({ ...s, steps: [] }));
      return;
    }
    setState(s => ({ ...s, loadingSteps: true, steps: null, error: null }));
    if (!send({
      type: "flow.steps.load",
      sessionId, body: JSON.stringify({ flowId }),
    })) setState(s => ({ ...s, loadingSteps: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveSteps = useCallback((flowId: number, steps: FlowStep[]) => {
    if (!flowId || flowId <= 0) {
      setState(s => ({ ...s, error: "No active flow — cannot save steps." }));
      return;
    }
    setState(s => ({ ...s, savingSteps: true, error: null }));
    if (!send({
      type: "flow.steps.save",
      sessionId, body: JSON.stringify({ flowId, steps }),
    })) setState(s => ({ ...s, savingSteps: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  return { ...state, loadFlows, saveFlow, deleteFlow, loadSteps, saveSteps };
}
