// Types shared by the bridge server and the 3D client.

export const DESK_COUNT = 24;
/** Desk index used for a floor's issue-board PM agent. */
export const PM_DESK = -1;

export type Activity = "working" | "needs-input" | "done" | "error" | "idle";

export interface ProjectInfo {
  id: string;
  title: string;
  workspaceRoot: string;
}

export interface AgentInfo {
  id: string;
  projectId: string;
  title: string;
  status: string;
  activity: Activity;
  pendingKind: string | null;
  lastMessage: string | null;
  lastMessageRole: string | null;
  model: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
  link: string | null;
  lastError: string | null;
  /** Desk index on its project's floor, PM_DESK for the board manager, null if no seat. */
  desk: number | null;
  isPm: boolean;
}

export type IssueStatus = "todo" | "doing" | "review" | "done";

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  body: string;
  status: IssueStatus;
  assignee: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeSnapshot {
  connected: boolean;
  error: string | null;
  projects: ProjectInfo[];
  agents: AgentInfo[];
  issues: Issue[];
  pm: Record<string, string>;
  bridgeUrl: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  text: string;
  title: string | null;
  status: string | null;
  at: string | null;
  role?: string;
}

export interface PendingQuestion {
  id: string;
  header: string;
  question: string;
  multiSelect: boolean;
  options: { label: string; description: string; value?: string }[];
}

export interface PendingRequest {
  requestId: string;
  kind: string;
  prompt: string | null;
  reason: string | null;
  questions: PendingQuestion[];
  options: { decision: string; label: string }[];
}

export interface ThreadDetail {
  id: string;
  items: ActivityItem[];
  pending: PendingRequest | null;
}
