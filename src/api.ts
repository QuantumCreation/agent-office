// Client for the office bridge (server/bridge.ts).

import type { OfficeSnapshot, ThreadDetail, Issue } from "../shared/types.ts";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  subscribe(onSnapshot: (s: OfficeSnapshot) => void, onStatus: (connected: boolean) => void) {
    let es: EventSource | null = null;
    const open = () => {
      es = new EventSource("/api/events");
      es.addEventListener("snapshot", (e) => onSnapshot(JSON.parse((e as MessageEvent).data)));
      es.onopen = () => onStatus(true);
      es.onerror = () => {
        onStatus(false);
        es?.close();
        setTimeout(open, 2000);
      };
    };
    open();
    return () => es?.close();
  },
  detail: (id: string) => call<ThreadDetail>("GET", `/api/threads/${encodeURIComponent(id)}`),
  send: (id: string, text: string) => call("POST", `/api/threads/${encodeURIComponent(id)}/send`, { text }),
  archive: (id: string) => call("POST", `/api/threads/${encodeURIComponent(id)}/archive`, {}),
  stop: (id: string) => call("POST", `/api/threads/${encodeURIComponent(id)}/stop`, {}),
  settle: (id: string) => call("POST", `/api/threads/${encodeURIComponent(id)}/settle`, {}),
  visit: (id: string) => call("POST", `/api/threads/${encodeURIComponent(id)}/visit`, {}),
  respond: (id: string, body: { requestId: string; decision?: string; answers?: Record<string, unknown> }) =>
    call("POST", `/api/threads/${encodeURIComponent(id)}/respond`, body),
  hire: (body: { projectId: string; message: string; title?: string; desk?: number; model?: string; provider?: string }) =>
    call<{ threadId: string }>("POST", "/api/hire", body),
  meeting: (threadIds: string[], text: string) => call<{ sent: number }>("POST", "/api/meeting", { threadIds, text }),
  addProject: (path: string) => call("POST", "/api/projects", { path }),
  ensurePm: (projectId: string) => call<{ threadId: string }>("POST", "/api/pm", { projectId }),
  createIssue: (body: { projectId: string; title: string; body?: string }) =>
    call<Issue>("POST", "/api/issues", { ...body, createdBy: "boss" }),
  updateIssue: (id: string, body: Partial<Issue>) => call<Issue>("PATCH", `/api/issues/${id}`, body),
  deleteIssue: (id: string) => call("DELETE", `/api/issues/${id}`),
  assignIssue: (id: string, threadId: string) => call<Issue>("POST", `/api/issues/${id}/assign`, { threadId }),
  hireForIssue: (id: string, desk?: number) => call("POST", `/api/issues/${id}/hire`, { desk }),
};
