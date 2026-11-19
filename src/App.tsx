import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Info, MessageSquare, Plus, Search, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { issuesUrl, newIdeaUrl, votesTimeoutMs } from "./config";
import { fetchIssues, matches, mergeIssues, MOUNT_LABEL, readSnapshot, sortIdeas, type Idea } from "./ideas";

const snapshot = readSnapshot();

type VoteState = { live: boolean; note: string };

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
      {children}
      <ExternalLink className="ml-1 inline size-3 align-[-1px]" aria-hidden />
    </a>
  );
}

const discussionLabel = (url: string) => {
  const m = /\/discussions\/(\d+)/.exec(url);
  return m ? `Discussion #${m[1]}` : "Source";
};

function IdeaCard({ idea, live }: { idea: Idea; live: boolean }) {
  const [open, setOpen] = useState(false);
  const d = idea.demand;
  const first = idea.sources[0];
  return (
    <Card size="sm" className="gap-0 rounded-lg ring-border">
      <CardContent className="flex gap-3 px-3">
        <div className="w-11 shrink-0 text-center" title={d ? `${d.upvotes} upvotes upstream, read ${d.as_of}` : undefined}>
          <div className="text-base leading-none font-semibold tabular-nums">{d ? d.upvotes : "–"}</div>
          <div className="mt-1 text-[10px] leading-none text-muted-foreground">upstream</div>
          {live && (
            <div className="mt-2 flex items-center justify-center gap-0.5 text-xs font-medium text-primary tabular-nums">
              <ThumbsUp className="size-3" aria-hidden />
              {idea.votes}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{idea.title}</h2>
          {idea.title_zh && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{idea.title_zh}</p>}
          <p className={cn("mt-1.5 text-sm text-foreground/80 [overflow-wrap:anywhere]", !open && "line-clamp-2")}>{idea.problem}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <Badge variant="outline">{idea.category}</Badge>
            {idea.submitted && <Badge variant="secondary">New</Badge>}
            {d?.comments !== undefined && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="size-3" aria-hidden />
                {d.comments}
              </span>
            )}
            {first && <ExtLink href={first.url}>{discussionLabel(first.url)}</ExtLink>}
            {idea.issueUrl && <ExtLink href={idea.issueUrl}>Vote on GitHub</ExtLink>}
            <Button variant="ghost" size="xs" className="-ml-1 text-muted-foreground" aria-expanded={open} onClick={() => setOpen(!open)}>
              Details
              <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden />
            </Button>
          </div>
          {open && (
            <div className="mt-2 space-y-2 border-t pt-2 text-xs text-muted-foreground">
              {d && (
                <p>
                  Upstream demand: {d.upvotes} upvotes on the {d.basis}, read {d.as_of}. Counts from different sources are not added.
                </p>
              )}
              {idea.sources.length > 0 && (
                <ul className="space-y-1">
                  {idea.sources.map((s) => (
                    <li key={s.url} className="[overflow-wrap:anywhere]">
                      <ExtLink href={s.url}>{s.title}</ExtLink> <span className="whitespace-nowrap">({s.date})</span>
                    </li>
                  ))}
                </ul>
              )}
              <p>
                <span className="font-medium text-foreground/80">Could start today with: </span>
                {MOUNT_LABEL[idea.mount_today.type]}
                {idea.mount_today.note && ` — ${idea.mount_today.note}`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function App() {
  const [ideas, setIdeas] = useState<Idea[]>(() => mergeIssues(snapshot, []));
  const [vote, setVote] = useState<VoteState>({ live: false, note: "Loading 👍 counts…" });
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchIssues(votesTimeoutMs)
      .then((issues) => {
        setIdeas(mergeIssues(snapshot, issues));
        setVote({ live: true, note: "Sorted by 👍 on this repository's issues (one GitHub API request, first 100 issues)." });
      })
      .catch(() => setVote({ live: false, note: `Live 👍 counts unavailable, so ideas are sorted by upstream upvotes read ${snapshot.as_of}.` }));
  }, []);

  const categories = useMemo(() => [...new Set(ideas.map((i) => i.category))].sort(), [ideas]);
  const items = useMemo(() => [{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))], [categories]);
  const shown = useMemo(
    () => sortIdeas(ideas.filter((i) => (category === "all" || i.category === category) && matches(i, query)), vote.live),
    [ideas, category, query, vote.live],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
      <header>
        <h1 className="text-base font-semibold">Awesome T3 Code Plugin Ideas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plugin ideas people already asked for in public T3 Code discussions, ranked by demand so the most wanted are easy to find if an official plugin API arrives.
          来自 T3 Code 公开讨论的插件想法，按热度排序。
        </p>
        <p className="mt-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Unofficial community project, not affiliated with, endorsed by or sponsored by T3 Code or its maintainers. 非官方社区项目，与 T3 Code 官方及其维护者无隶属关系。
        </p>
      </header>

      <Card size="sm" className="mt-4 gap-0 rounded-lg ring-border">
        <CardContent className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">Take part</p>
            <p className="text-xs text-muted-foreground">Add a 👍 to the issue of an idea you want. Missing one? Submit it with a public source.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a href={issuesUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
              <ThumbsUp data-icon="inline-start" aria-hidden />
              Vote
            </a>
            <a href={newIdeaUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
              <Plus data-icon="inline-start" aria-hidden />
              Submit an idea
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ideas" aria-label="Search ideas" className="pl-8" />
        </div>
        <Select items={items} value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {items.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums sm:w-16 sm:text-right">
          {shown.length} / {ideas.length}
        </span>
      </div>

      <p role="status" className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
        {vote.note}
      </p>

      <main className="mt-3 space-y-2">
        {shown.length ? shown.map((i) => <IdeaCard key={i.slug} idea={i} live={vote.live} />) : <p className="py-6 text-sm text-muted-foreground">No ideas match these filters.</p>}
      </main>

      <footer className="mt-8 border-t pt-3 text-xs text-muted-foreground">
        Unofficial. "T3 Code" is named only to say what these ideas are for. Idea list under CC0-1.0. "Upstream" counts are upvotes on the upstream discussion at the date shown; the 👍 count is reactions on this repository's issues.
      </footer>
    </div>
  );
}
