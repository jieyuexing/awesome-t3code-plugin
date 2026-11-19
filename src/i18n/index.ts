import languages from "./languages.json";
import { en, type Dict } from "./en";
import { zh } from "./zh";

export interface Language {
  code: string;
  label: string;
  htmlLang: string;
  suffix: string;
  match: string;
}

// 加一种语言：languages.json 加一行，新增一份 Dict，下面的 DICTS 登记，数据里补对应后缀的字段。
export const LANGUAGES: Language[] = languages;
const DICTS: Record<string, Dict> = { en, zh };
const FALLBACK = LANGUAGES[0].code;
const STORAGE_KEY = "lang";

export const dictOf = (code: string): Dict => DICTS[code] ?? DICTS[FALLBACK];

// 把 zh、zh-CN、zh-Hans 等归到已支持的语言；不认识的返回 undefined。
export function normalize(tag: string | null | undefined): string | undefined {
  const base = tag?.toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.find((l) => l.match === base)?.code;
}

function stored(): string | undefined {
  try {
    return normalize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return undefined;
  }
}

// 优先级：URL 参数 ?lang=，上次的选择，否则英文；不看浏览器语言。
export function detectLanguage(): string {
  const fromUrl = normalize(new URLSearchParams(location.search).get("lang"));
  if (fromUrl) return fromUrl;
  return stored() ?? FALLBACK;
}

// 同步 localStorage、URL 参数（保留其他参数和 hash）和 <html lang>。
export function applyLanguage(code: string, persist: boolean): void {
  const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  document.documentElement.lang = lang.htmlLang;
  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang.code);
  } catch {
    // 存储不可用时页面照常工作
  }
  const url = new URL(location.href);
  url.searchParams.set("lang", lang.code);
  history.replaceState(history.state, "", url);
}

// 取数据里某个字段的当前语言版本，缺失时回落到基础（英文）字段。
export function pick(obj: object, key: string, code: string): string {
  const suffix = LANGUAGES.find((l) => l.code === code)?.suffix ?? "";
  const rec = obj as Record<string, unknown>;
  const v = suffix ? rec[key + suffix] : undefined;
  return typeof v === "string" && v.trim() ? v : String(rec[key] ?? "");
}
