import { CONFIG } from "./config";

export type MountType = "custom-css" | "mcp" | "skill" | "standalone-page" | "needs-plugin-api";

export interface Idea {
  slug: string;
  title: string;
  title_zh: string;
  problem: string;
  category: string;
  sources: { url: string; title: string; date: string }[];
  demand: { basis: "discussion" | "comment"; upvotes: number; comments?: number; url: string; as_of: string } | null;
  mount_today: { type: MountType; note: string; docs?: string };
  status: string;
  votes: number;
  issueUrl: string | null;
  submitted: boolean;
}

interface Snapshot {
  as_of: string;
  ideas: Omit<Idea, "votes" | "issueUrl" | "submitted">[];
}

interface Issue {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  pull_request?: unknown;
  reactions?: { "+1"?: number };
}

export const MOUNT_LABEL: Record<MountType, string> = {
  "custom-css": "Custom CSS theme",
  mcp: "MCP server",
  skill: "Skill",
  "standalone-page": "Standalone page",
  "needs-plugin-api": "Needs a plugin API",
};

export function readSnapshot(): Snapshot {
  return JSON.parse(document.getElementById("ideas-data")!.textContent!);
}

// issue 正文按 .github/ISSUE_TEMPLATE/idea.yml 的字段标题分节。
function sectionsOf(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of body.replace(/\r\n/g, "\n").split(/^### /m).slice(1)) {
    const nl = part.indexOf("\n");
    const value = part.slice(nl < 0 ? part.length : nl + 1).trim();
    out[part.slice(0, nl < 0 ? part.length : nl).trim()] = value === "_No response_" ? "" : value;
  }
  return out;
}

// 把 API 返回的 issue 并入快照：<!-- idea:slug --> 标记对应已有想法，没有标记的当作用户新提交的。
export function mergeIssues(snapshot: Snapshot, issues: Issue[]): Idea[] {
  const bySlug = new Map<string, Idea>(snapshot.ideas.map((i) => [i.slug, { ...i, votes: 0, issueUrl: null, submitted: false }]));
  const extra: Idea[] = [];
  for (const issue of issues) {
    if (issue.pull_request) continue;
    const votes = issue.reactions?.["+1"] ?? 0;
    const slug = /<!-- idea:([a-z0-9-]+) -->/.exec(issue.body ?? "")?.[1];
    const known = slug ? bySlug.get(slug) : undefined;
    if (known) {
      known.votes = votes;
      known.issueUrl = issue.html_url;
      continue;
    }
    const s = sectionsOf(issue.body ?? "");
    const mount = s["Mount today"] as MountType;
    extra.push({
      slug: `issue-${issue.number}`,
      title: issue.title.replace(/^\[idea\]\s*/i, ""),
      title_zh: s["Title (中文)"] ?? "",
      problem: s["Problem"] ?? "",
      category: s["Category"] || "other",
      sources: [],
      demand: null,
      mount_today: { type: mount in MOUNT_LABEL ? mount : "needs-plugin-api", note: s["Why that mount"] ?? "" },
      status: "open",
      votes,
      issueUrl: issue.html_url,
      submitted: true,
    });
  }
  return [...bySlug.values(), ...extra];
}

export async function fetchIssues(timeoutMs: number): Promise<Issue[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/issues?labels=${CONFIG.label}&state=open&per_page=100`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function sortIdeas(list: Idea[], live: boolean): Idea[] {
  const up = (i: Idea) => i.demand?.upvotes ?? -1;
  const cm = (i: Idea) => i.demand?.comments ?? 0;
  return [...list].sort((a, b) =>
    live
      ? b.votes - a.votes || up(b) - up(a) || cm(b) - cm(a)
      : up(b) - up(a) || cm(b) - cm(a) || a.title.localeCompare(b.title),
  );
}

export function matches(i: Idea, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [i.title, i.title_zh, i.problem, i.category].some((t) => t.toLowerCase().includes(q));
}
