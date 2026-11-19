#!/usr/bin/env node
// 校验 ideas/ideas.json，并检查构建产物 docs/index.html 内嵌的快照与它一致。
// 用法：node scripts/check.mjs [ideas.json 路径]   只校验该文件
//       node scripts/check.mjs                     校验默认文件并核对页面快照（不一致就先 pnpm build）
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const MOUNT_TYPES = ["custom-css", "mcp", "skill", "standalone-page", "needs-plugin-api"];
export const STATUSES = ["open", "built", "shipped-upstream"];
const SNAPSHOT = /<script id="ideas-data" type="application\/json">([\s\S]*?)<\/script>/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isText = (v) => typeof v === "string" && v.trim() !== "";
const isHttps = (v) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

export function validate(doc) {
  const errors = [];
  const ideas = doc?.ideas;
  if (!Array.isArray(ideas) || ideas.length === 0) return ["ideas 必须是非空数组"];
  const seen = new Set();
  ideas.forEach((idea, i) => {
    const id = isText(idea?.slug) ? idea.slug : `#${i}`;
    const bad = (msg) => errors.push(`${id}: ${msg}`);
    for (const key of ["slug", "title", "title_zh", "problem", "category"]) {
      if (!isText(idea?.[key])) bad(`缺少必填字段 ${key}`);
    }
    if (isText(idea?.slug)) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(idea.slug)) bad("slug 只能用小写字母、数字和连字符");
      if (seen.has(idea.slug)) bad("slug 重复");
      seen.add(idea.slug);
    }
    const sources = idea?.sources;
    if (!Array.isArray(sources) || sources.length === 0) bad("至少需要一个 https 来源");
    else
      sources.forEach((s, j) => {
        if (!isHttps(s?.url)) bad(`sources[${j}].url 必须是 https 链接`);
        if (!DATE.test(s?.date ?? "")) bad(`sources[${j}].date 必须是 YYYY-MM-DD`);
        if (!isText(s?.title)) bad(`sources[${j}].title 缺失`);
      });
    const d = idea?.demand;
    if (!d || !Number.isInteger(d.upvotes) || d.upvotes < 0) bad("demand.upvotes 必须是非负整数");
    if (!DATE.test(d?.as_of ?? "")) bad("demand.as_of 必须是 YYYY-MM-DD");
    if (!["discussion", "comment"].includes(d?.basis)) bad("demand.basis 只能是 discussion 或 comment");
    if (!isHttps(d?.url)) bad("demand.url 必须是 https 链接");
    const m = idea?.mount_today;
    if (!MOUNT_TYPES.includes(m?.type)) bad(`mount_today.type 必须是 ${MOUNT_TYPES.join(" / ")} 之一`);
    if (!isText(m?.note)) bad("mount_today.note 缺失");
    if (m?.docs !== undefined && !isHttps(m.docs)) bad("mount_today.docs 必须是 https 链接");
    if (!STATUSES.includes(idea?.status)) bad(`status 必须是 ${STATUSES.join(" / ")} 之一`);
    // 文字会原样进 issue 正文，GitHub 会通知被 @ 的人。
    if (/(^|[^\w`])@[A-Za-z0-9-]/.test(JSON.stringify(idea))) bad("不得含 @用户名，GitHub 会通知对方；写不带 @ 的用户名");
  });
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith("--"));
  const ideasPath = fileArg ? resolve(fileArg) : resolve(root, "ideas/ideas.json");
  let doc;
  try {
    doc = JSON.parse(readFileSync(ideasPath, "utf8"));
  } catch (e) {
    console.error(`FAIL 无法读取 ${ideasPath}: ${e.message}`);
    process.exit(1);
  }
  const errors = validate(doc);
  if (errors.length) {
    for (const e of errors) console.error(`FAIL ${e}`);
    console.error(`${errors.length} 个问题`);
    process.exit(1);
  }
  if (!fileArg) {
    const page = readFileSync(resolve(root, "docs/index.html"), "utf8");
    const embedded = SNAPSHOT.exec(page)?.[1];
    if (embedded === undefined) {
      console.error('FAIL docs/index.html 缺少 <script id="ideas-data"> 快照，运行 pnpm build');
      process.exit(1);
    }
    if (JSON.stringify(JSON.parse(embedded)) !== JSON.stringify(doc)) {
      console.error("FAIL docs/index.html 内嵌快照与 ideas/ideas.json 不一致，运行 pnpm build");
      process.exit(1);
    }
  }
  console.log(`OK ${doc.ideas.length} 条想法通过校验`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
