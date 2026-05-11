// WebSocket client for the Requirements tab.
//
// Server contract (see SimpleWebSocketServer):
//   send  requirement.list              body: {botJobId}
//   recv  requirement.listResponse      body: [Requirement...]
//
//   send  requirement.save              body: {requirement: {...}}     id null = create
//   recv  requirement.saveResponse      body: {ok, id, requirement}
//
//   send  requirement.delete            body: {requirementId}
//   recv  requirement.deleteResponse    body: {ok, requirementId}
//
//   send  requirement.links.load        body: {requirementId}
//   recv  requirement.linksLoaded       body: RequirementLinks
//
//   send  requirement.links.save        body: {requirementId, useCaseIds, flowIds}
//   recv  requirement.linksSaved        body: {ok, requirementId}
//
//   send  useCase.list / flow.list      (re-uses the existing server verbs to fill
//                                        the right-column checkbox lists)
//   recv  useCase.listResponse / flow.listResponse

import { useCallback, useEffect, useRef, useState } from "react";
import type { Requirement, RequirementLinks } from "./types";

/** Subset of UseCase / Flow rows the right column needs (id + name). */
export interface NamedRow {
  id: number;
  name: string;
  description?: string | null;
}

interface Options {
  socketPort: number;
  sessionId: string;
}

interface State {
  connected: boolean;
  loadingRequirements: boolean;
  savingRequirement: boolean;
  loadingLinks: boolean;
  savingLinks: boolean;
  error: string | null;
  requirements: Requirement[];
  links: RequirementLinks | null;       // for the currently selected requirement
  useCases: NamedRow[];
  flows: NamedRow[];
  lastReqSaveOk: boolean | null;
  lastReqSaveAt: string | null;
  lastReqSaved: Requirement | null;
  lastReqDeletedId: number | null;
  lastLinksSaveOk: boolean | null;
  lastLinksSaveAt: string | null;
}

const INITIAL: State = {
  connected: false,
  loadingRequirements: false,
  savingRequirement: false,
  loadingLinks: false,
  savingLinks: false,
  error: null,
  requirements: [],
  links: null,
  useCases: [],
  flows: [],
  lastReqSaveOk: null,
  lastReqSaveAt: null,
  lastReqSaved: null,
  lastReqDeletedId: null,
  lastLinksSaveOk: null,
  lastLinksSaveAt: null,
};

export function useRequirementsSocket({ socketPort, sessionId }: Options) {
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

        if (verb === "requirement.listResponse") {
          const parsed = parseBody<Requirement[]>() ?? [];
          setState(s => ({ ...s, loadingRequirements: false, requirements: parsed, error: null }));
        } else if (verb === "requirement.saveResponse") {
          const parsed = parseBody<{ ok: boolean; id?: number; requirement?: Requirement; error?: string }>()
            ?? { ok: false };
          setState(s => ({
            ...s,
            savingRequirement: false,
            lastReqSaveOk: parsed.ok,
            lastReqSaveAt: new Date().toISOString(),
            lastReqSaved: parsed.requirement ?? null,
            error: parsed.ok ? null : parsed.error || "Requirement save failed",
          }));
        } else if (verb === "requirement.deleteResponse") {
          const parsed = parseBody<{ ok: boolean; requirementId?: number; error?: string }>() ?? { ok: false };
          setState(s => ({
            ...s,
            lastReqDeletedId: parsed.ok ? (parsed.requirementId ?? null) : null,
            error: parsed.ok ? null : parsed.error || "Requirement delete failed",
          }));
        } else if (verb === "requirement.linksLoaded") {
          const parsed = parseBody<RequirementLinks>() ?? null;
          setState(s => ({ ...s, loadingLinks: false, links: parsed, error: null }));
        } else if (verb === "requirement.linksSaved") {
          const parsed = parseBody<{ ok: boolean; requirementId?: number; error?: string }>() ?? { ok: false };
          setState(s => ({
            ...s,
            savingLinks: false,
            lastLinksSaveOk: parsed.ok,
            lastLinksSaveAt: new Date().toISOString(),
            error: parsed.ok ? null : parsed.error || "Links save failed",
          }));
        } else if (verb === "useCase.listResponse") {
          const parsed = parseBody<NamedRow[]>() ?? [];
          setState(s => ({ ...s, useCases: parsed }));
        } else if (verb === "flow.listResponse") {
          const parsed = parseBody<NamedRow[]>() ?? [];
          setState(s => ({ ...s, flows: parsed }));
        }
      } catch (e) {
        setState(s => ({ ...s, error: `Parse error: ${(e as Error).message}` }));
      }
    };

    ws.onerror = () => setState(s => ({ ...s, error: "WebSocket connection error" }));
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

  // ── Requirements CRUD ───────────────────────────────────────────────────
  const loadRequirements = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) { setState(s => ({ ...s, requirements: [] })); return; }
    setState(s => ({ ...s, loadingRequirements: true, error: null }));
    if (!send({ type: "requirement.list", sessionId, botJobId, body: JSON.stringify({ botJobId }) }))
      setState(s => ({ ...s, loadingRequirements: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveRequirement = useCallback((requirement: Partial<Requirement> & { botJobId: number; title: string }) => {
    setState(s => ({ ...s, savingRequirement: true, lastReqSaved: null, error: null }));
    if (!send({ type: "requirement.save", sessionId, body: JSON.stringify({ requirement }) }))
      setState(s => ({ ...s, savingRequirement: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const deleteRequirement = useCallback((requirementId: number) => {
    if (!requirementId || requirementId <= 0) return;
    setState(s => ({ ...s, lastReqDeletedId: null, error: null }));
    if (!send({ type: "requirement.delete", sessionId, body: JSON.stringify({ requirementId }) }))
      setState(s => ({ ...s, error: "Socket not connected." }));
  }, [send, sessionId]);

  const loadLinks = useCallback((requirementId: number) => {
    if (!requirementId || requirementId <= 0) { setState(s => ({ ...s, links: null })); return; }
    setState(s => ({ ...s, loadingLinks: true, links: null, error: null }));
    if (!send({ type: "requirement.links.load", sessionId, body: JSON.stringify({ requirementId }) }))
      setState(s => ({ ...s, loadingLinks: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  const saveLinks = useCallback((requirementId: number, useCaseIds: number[], flowIds: number[]) => {
    if (!requirementId || requirementId <= 0) return;
    setState(s => ({ ...s, savingLinks: true, error: null }));
    if (!send({
      type: "requirement.links.save", sessionId,
      body: JSON.stringify({ requirementId, useCaseIds, flowIds }),
    })) setState(s => ({ ...s, savingLinks: false, error: "Socket not connected." }));
  }, [send, sessionId]);

  // ── Sources for the right-column checkbox lists (re-use existing verbs) ─
  const loadUseCases = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) { setState(s => ({ ...s, useCases: [] })); return; }
    if (!send({ type: "useCase.list", sessionId, botJobId, body: JSON.stringify({ botJobId }) }))
      setState(s => ({ ...s, error: "Socket not connected." }));
  }, [send, sessionId]);

  const loadFlows = useCallback((botJobId: number) => {
    if (!botJobId || botJobId <= 0) { setState(s => ({ ...s, flows: [] })); return; }
    if (!send({ type: "flow.list", sessionId, botJobId, body: JSON.stringify({ botJobId }) }))
      setState(s => ({ ...s, error: "Socket not connected." }));
  }, [send, sessionId]);

  return {
    ...state,
    loadRequirements, saveRequirement, deleteRequirement,
    loadLinks, saveLinks,
    loadUseCases, loadFlows,
  };
}
