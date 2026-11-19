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
export const VALUES = ["high", "medium", "low"];
// 语言登记表与页面共用：每种语言的数据字段后缀（基础语言为空）。
export const LANGUAGES = JSON.parse(readFileSync(resolve(root, "src/i18n/languages.json"), "utf8"));
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

// categoryNames: { 语言 code: { 分类: 显示名 } }，传入时校验每个分类在每种语言的字典里都有名字。
export function validate(doc, categoryNames) {
  const errors = [];
  const ideas = doc?.ideas;
  if (!Array.isArray(ideas) || ideas.length === 0) return ["ideas 必须是非空数组"];
  const seen = new Set();
  ideas.forEach((idea, i) => {
    const id = isText(idea?.slug) ? idea.slug : `#${i}`;
    const bad = (msg) => errors.push(`${id}: ${msg}`);
    for (const key of ["slug", "category"]) {
      if (!isText(idea?.[key])) bad(`缺少必填字段 ${key}`);
    }
    // 每种登记的语言都要有标题、问题描述、挂载说明和审查理由。
    for (const { suffix } of LANGUAGES) {
      for (const [label, holder, key] of [
        ["title", idea, "title"],
        ["problem", idea, "problem"],
        ["mount_today.note", idea?.mount_today, "note"],
        ["review.reasons", idea?.review, "reasons"],
      ]) {
        if (!isText(holder?.[key + suffix])) bad(`缺少必填字段 ${label}${suffix}`);
      }
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
    const r = idea?.review;
    if (!VALUES.includes(r?.value)) bad(`review.value 必须是 ${VALUES.join(" / ")} 之一`);
    if (!DATE.test(r?.as_of ?? "")) bad("review.as_of 必须是 YYYY-MM-DD");
    if (!/^(keep|drop|merge-into:[a-z0-9-]+)$/.test(r?.action ?? "")) bad("review.action 必须是 keep / drop / merge-into:<slug>");
    if (categoryNames) {
      for (const [code, names] of Object.entries(categoryNames)) {
        if (isText(idea?.category) && !isText(names[idea.category])) bad(`分类 ${idea.category} 在 ${code} 字典里没有显示名`);
      }
    }
    if (!STATUSES.includes(idea?.status)) bad(`status 必须是 ${STATUSES.join(" / ")} 之一`);
    // 文字会原样进 issue 正文，GitHub 会通知被 @ 的人。
    if (/(^|[^\w`])@[A-Za-z0-9-]/.test(JSON.stringify(idea))) bad("不得含 @用户名，GitHub 会通知对方；写不带 @ 的用户名");
  });
  const byslug = new Map(ideas.map((i) => [i?.slug, i]));
  for (const idea of ideas) {
    const target = /^merge-into:(.+)$/.exec(idea?.review?.action ?? "")?.[1];
    if (target === undefined) continue;
    if (target === idea.slug) errors.push(`${idea.slug}: merge-into 不能指向自己`);
    else if (!byslug.has(target)) errors.push(`${idea.slug}: merge-into 目标 ${target} 不存在`);
    else if (byslug.get(target)?.review?.action !== "keep") errors.push(`${idea.slug}: merge-into 目标 ${target} 自身必须是 keep`);
  }
  return errors;
}

// 字典是 TypeScript 文件，Node 直接去掉类型后加载，只取分类名。
export async function loadCategoryNames() {
  const out = {};
  for (const { code } of LANGUAGES) out[code] = (await import(`../src/i18n/${code}.ts`))[code].categories;
  return out;
}

async function main() {
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
  const errors = validate(doc, await loadCategoryNames());
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
