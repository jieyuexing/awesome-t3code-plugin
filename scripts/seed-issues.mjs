#!/usr/bin/env node
// 按 ideas/ideas.json 批量开 issue，每个想法一条、打 idea 标签。
// 默认 dry-run 只打印；带 --execute --repo <owner/name> 才真开。已存在同 slug 标记的 issue 会跳过。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "./check.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LABEL = { name: "idea", color: "1d76db", description: "A plugin idea collected from public discussion" };

export const marker = (slug) => `<!-- idea:${slug} -->`;

// 正文的小节标题与 .github/ISSUE_TEMPLATE/idea.yml 的字段标签一致，页面按同样的标题解析。
export function issueBody(idea) {
  const sources = idea.sources.map((s) => `- [${s.title}](${s.url}) (${s.date})`).join("\n");
  const d = idea.demand;
  return [
    marker(idea.slug),
    `> [!NOTE]\n> Drafted by Claude Sonnet 5.5 in T3 Code; reviewed and posted by @jieyuexing`,
    `### Title (中文)\n\n${idea.title_zh}`,
    `### Problem\n\n${idea.problem}`,
    `### Category\n\n${idea.category}`,
    `### Public sources\n\n${sources}`,
    `### Upstream demand\n\n${d.upvotes} upvotes on the ${d.basis} at ${d.url}, read ${d.as_of}. This is the upstream count, not votes on this repository.`,
    `### Mount today\n\n${idea.mount_today.type}`,
    `### Why that mount\n\n${idea.mount_today.note}${idea.mount_today.docs ? `\n\nDocs: ${idea.mount_today.docs}` : ""}`,
    `Vote by adding a 👍 reaction to this issue.`,
  ].join("\n\n");
}

const gh = (args, input) => execFileSync("gh", args, { input, encoding: "utf8" });

function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const repoAt = args.indexOf("--repo");
  const repo = repoAt >= 0 ? args[repoAt + 1] : undefined;
  const doc = JSON.parse(readFileSync(resolve(root, "ideas/ideas.json"), "utf8"));
  const errors = validate(doc);
  if (errors.length) {
    errors.forEach((e) => console.error(`FAIL ${e}`));
    process.exit(1);
  }
  if (execute && !repo) {
    console.error("--execute 需要 --repo <owner/name>");
    process.exit(1);
  }

  console.log(execute ? `EXECUTE on ${repo}` : "DRY-RUN（不创建任何东西；加 --execute --repo <owner/name> 才真开）");
  console.log(`step 1: 创建标签 "${LABEL.name}"（已存在则忽略）`);
  let existing = "";
  if (execute) {
    try {
      gh(["label", "create", LABEL.name, "--repo", repo, "--color", LABEL.color, "--description", LABEL.description]);
    } catch {
      // 标签已存在
    }
    existing = gh(["issue", "list", "--repo", repo, "--label", LABEL.name, "--state", "all", "--limit", "1000", "--json", "body", "--jq", ".[].body"]);
  }

  let created = 0;
  doc.ideas.forEach((idea, i) => {
    const body = issueBody(idea);
    console.log(`\nstep ${i + 2}: issue "${idea.title}" [label: ${LABEL.name}] [slug: ${idea.slug}]`);
    if (!execute) {
      console.log(body.split("\n").map((l) => `  | ${l}`).join("\n"));
      return;
    }
    if (existing.includes(marker(idea.slug))) {
      console.log("  已存在，跳过");
      return;
    }
    console.log(`  ${gh(["issue", "create", "--repo", repo, "--title", idea.title, "--label", LABEL.name, "--body-file", "-"], body).trim()}`);
    created += 1;
  });
  console.log(execute ? `\n完成，新建 ${created} 条` : `\n共 ${doc.ideas.length} 条将被创建，未执行`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
