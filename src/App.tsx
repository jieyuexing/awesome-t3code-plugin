import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Info, Languages, MessageSquare, Plus, Search, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { issuesUrl, newIdeaUrl, votesTimeoutMs } from "./config";
import { applyLanguage, detectLanguage, dictOf, LANGUAGES, pick } from "./i18n";
import type { Dict } from "./i18n/en";
import { fetchIssues, matches, mergeIssues, readSnapshot, sortIdeas, VALUES, type Idea, type Value } from "./ideas";

const snapshot = readSnapshot();

type VoteState = "loading" | "live" | "fallback";

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
      {children}
      <ExternalLink className="ml-1 inline size-3 align-[-1px]" aria-hidden />
    </a>
  );
}

const discussionLabel = (url: string, t: Dict) => {
  const m = /\/discussions\/(\d+)/.exec(url);
  return m ? t.discussion(m[1]) : t.source;
};

const VALUE_STYLE: Record<Value, string> = {
  high: "border-transparent bg-primary/10 text-primary",
  medium: "border-transparent bg-secondary text-secondary-foreground",
  low: "text-muted-foreground",
};

const categoryName = (t: Dict, category: string) => t.categories[category] ?? category;

function IdeaCard({ idea, live, lang, t }: { idea: Idea; live: boolean; lang: string; t: Dict }) {
  const [open, setOpen] = useState(false);
  const d = idea.demand;
  const first = idea.sources[0];
  return (
    <Card size="sm" className="gap-0 rounded-lg ring-border">
      <CardContent className="flex gap-3 px-3">
        <div className="w-11 shrink-0 text-center" title={d ? t.upstreamTitle(d.upvotes, d.as_of) : undefined}>
          <div className="text-base leading-none font-semibold tabular-nums">{d ? d.upvotes : "–"}</div>
          <div className="mt-1 text-[10px] leading-none text-muted-foreground">{t.upstream}</div>
          {live && (
            <div className="mt-2 flex items-center justify-center gap-0.5 text-xs font-medium text-primary tabular-nums">
              <ThumbsUp className="size-3" aria-hidden />
              {idea.votes}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{pick(idea, "title", lang)}</h2>
          <p className={cn("mt-1 text-sm text-foreground/80 [overflow-wrap:anywhere]", !open && "line-clamp-2")}>{pick(idea, "problem", lang)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <Badge variant="outline">{categoryName(t, idea.category)}</Badge>
            {idea.review && <Badge variant="outline" className={VALUE_STYLE[idea.review.value]}>{t.valueName[idea.review.value]}</Badge>}
            {idea.submitted && <Badge variant="secondary">{t.newBadge}</Badge>}
            {d?.comments !== undefined && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="size-3" aria-hidden />
                {d.comments}
              </span>
            )}
            {first && <ExtLink href={first.url}>{discussionLabel(first.url, t)}</ExtLink>}
            {idea.issueUrl && <ExtLink href={idea.issueUrl}>{t.voteOnGithub}</ExtLink>}
            <Button variant="ghost" size="xs" className="-ml-1 text-muted-foreground" aria-expanded={open} onClick={() => setOpen(!open)}>
              {t.details}
              <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden />
            </Button>
          </div>
          {open && (
            <div className="mt-2 space-y-2 border-t pt-2 text-xs text-muted-foreground">
              {d && (
                <p>{t.demandDetail(d.upvotes, t.basis[d.basis], d.as_of)}</p>
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
                <span className="font-medium text-foreground/80">{t.mountLead} </span>
                {t.mount[idea.mount_today.type]}
                {idea.mount_today.note && ` — ${pick(idea.mount_today, "note", lang)}`}
              </p>
              {idea.review && (
                <p>
                  <span className="font-medium text-foreground/80">{t.reviewLead(idea.review.as_of)} </span>
                  {pick(idea.review, "reasons", lang)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function App() {
  const [lang, setLang] = useState(detectLanguage);
  const [ideas, setIdeas] = useState<Idea[]>(() => mergeIssues(snapshot, []));
  const [vote, setVote] = useState<VoteState>("loading");
  const [category, setCategory] = useState("all");
  const [value, setValue] = useState("all");
  const [query, setQuery] = useState("");
  const t = dictOf(lang);

  useEffect(() => {
    applyLanguage(lang, false);
    document.title = t.docTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.docDescription);
  }, [lang, t]);

  useEffect(() => {
    fetchIssues(votesTimeoutMs)
      .then((issues) => {
        setIdeas(mergeIssues(snapshot, issues));
        setVote("live");
      })
      .catch(() => setVote("fallback"));
  }, []);

  const live = vote === "live";
  const voteNote = vote === "loading" ? t.voteLoading : live ? t.voteLive : t.voteFallback(snapshot.as_of);
  const languageItems = useMemo(() => LANGUAGES.map((l) => ({ value: l.code, label: l.label })), []);
  const categoryItems = useMemo(
    () => [{ value: "all", label: t.allCategories }, ...[...new Set(ideas.map((i) => i.category))].map((c) => ({ value: c, label: categoryName(t, c) })).sort((a, b) => a.label.localeCompare(b.label, lang))],
    [ideas, t, lang],
  );
  const valueItems = useMemo(() => [{ value: "all", label: t.allValues }, ...VALUES.map((v) => ({ value: v, label: t.valueName[v] }))], [t]);
  const shown = useMemo(
    () =>
      sortIdeas(
        ideas.filter(
          (i) => (category === "all" || i.category === category) && (value === "all" || i.review?.value === value) && matches(i, query, categoryName(t, i.category)),
        ),
        live,
      ),
    [ideas, category, value, query, live, t],
  );

  const switchLanguage = (code: string | null) => {
    if (code && LANGUAGES.some((l) => l.code === code)) {
      setLang(code);
      applyLanguage(code, true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 pt-1 text-base font-semibold [overflow-wrap:anywhere]">{t.docTitle}</h1>
          <Select items={languageItems} value={lang} onValueChange={switchLanguage}>
            <SelectTrigger className="shrink-0" size="sm" aria-label={t.language}>
              <Languages aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              {languageItems.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
        <p className="mt-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{t.disclaimer}</p>
      </header>

      <Card size="sm" className="mt-4 gap-0 rounded-lg ring-border">
        <CardContent className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">{t.takePart}</p>
            <p className="text-xs text-muted-foreground">{t.takePartHint}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a href={issuesUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
              <ThumbsUp data-icon="inline-start" aria-hidden />
              {t.vote}
            </a>
            <a href={newIdeaUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
              <Plus data-icon="inline-start" aria-hidden />
              {t.submit}
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} className="pl-8" />
        </div>
        <Select items={categoryItems} value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40" aria-label={t.category}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {categoryItems.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={valueItems} value={value} onValueChange={(v) => setValue(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-36" aria-label={t.value}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {valueItems.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums sm:w-14 sm:text-right">
          {shown.length} / {ideas.length}
        </span>
      </div>

      <p role="status" className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
        {voteNote}
      </p>

      <main className="mt-3 space-y-2">
        {shown.length ? shown.map((i) => <IdeaCard key={i.slug} idea={i} live={live} lang={lang} t={t} />) : <p className="py-6 text-sm text-muted-foreground">{t.empty}</p>}
      </main>

      <footer className="mt-8 border-t pt-3 text-xs text-muted-foreground">{t.footer}</footer>
    </div>
  );
}
