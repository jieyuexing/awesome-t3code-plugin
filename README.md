# Awesome T3 Code Plugin Ideas

**This is an unofficial community project. It is not affiliated with, endorsed by or sponsored by T3 Code or its maintainers.** "T3 Code" is named only to say what these ideas are for. No official logo or download link is used here.

A list of plugin ideas collected from public T3 Code discussions. If an official plugin API ever arrives, the high-demand ideas can be found quickly and built first. Until then, each idea says which official open entry (Custom CSS, MCP, a Skill, a standalone page) could carry a small version today.

## What is collected

- Ideas that someone already described in public, each with its public source link and date. Nothing is invented and nothing comes from private messages or email.
- For each idea: the problem, a category, the upstream demand (upvotes on the source discussion or comment, with the day it was read), and a `mount_today` value with one sentence of reasoning.
- [works-today.md](works-today.md): small projects that already work without a fork.

The data lives in [ideas/ideas.json](ideas/ideas.json). Rules are in [CONTRIBUTING.md](CONTRIBUTING.md): official open entries only, no ASAR injection or app patching.

## How to vote

Every idea is one GitHub issue labelled `idea`. Add a 👍 reaction to the issue you want. The static page in [docs/index.html](docs/index.html) reads those reactions with one GitHub API request when you open it and sorts by them. If the request fails, it falls back to the upstream upvotes stored in `ideas.json` and says so.

## How to submit

Open an issue with the "Plugin idea" form ([.github/ISSUE_TEMPLATE/idea.yml](.github/ISSUE_TEMPLATE/idea.yml)). You need a public https source with its date. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Maintaining

```sh
node scripts/check.mjs                 # validate ideas.json and the page snapshot
node scripts/check.mjs --fix           # rewrite the page snapshot from ideas.json
node scripts/seed-issues.mjs           # dry run: print the issues that would be created
node scripts/seed-issues.mjs --execute --repo OWNER/NAME   # create them (needs gh)
```

The repository owner and name used by the page are set in one place, the `CONFIG` constant at the top of the script in `docs/index.html`. The seed script takes the repository from `--repo`.

## License

The list content (`ideas/`, `works-today.md`, docs) is dedicated to the public domain under [CC0-1.0](LICENSE). The scripts in `scripts/` and `docs/index.html` are covered by the same CC0-1.0 dedication. Linked projects keep their own licenses.

---

# 中文说明

**这是非官方社区项目，与 T3 Code 官方及其维护者无隶属关系，也未获其认可或赞助。** 文中提到“T3 Code”只是说明这些想法是为谁做的；这里不使用官方 logo，也不放官方下载链接。

这是一份从 T3 Code 公开讨论里收集的插件想法清单。日后如果官方开放插件 API，可以按需求热度快速定位高价值的想法先做。在此之前，每条想法都写明现在能走哪个官方开放入口（Custom CSS、MCP、Skill、独立网页）先做一个最小版本。

## 收什么

- 别人已经在公开场合提过的想法，每条附公开来源链接和日期；不编造，不来自私信或邮件。
- 每条包含问题、分类、上游需求（来源讨论或评论的 upvote 数及取数日期）、`mount_today` 取值和一句理由。
- [works-today.md](works-today.md)：现在就能用、不需要 fork 的小件。

数据在 [ideas/ideas.json](ideas/ideas.json)，收录标准见 [CONTRIBUTING.md](CONTRIBUTING.md)：只收官方开放入口，不收 ASAR 注入或改应用包。

## 怎么投票

每个想法是一条带 `idea` 标签的 GitHub issue，给想要的 issue 点 👍。静态页 [docs/index.html](docs/index.html) 打开时用一次 GitHub API 请求读这些 👍 并排序；请求失败时回落为 `ideas.json` 里记录的上游 upvote 并显示说明。

## 怎么提交

用“Plugin idea”表单开 issue（[.github/ISSUE_TEMPLATE/idea.yml](.github/ISSUE_TEMPLATE/idea.yml)），需要一个带日期的公开 https 来源。先读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

列表内容（`ideas/`、`works-today.md`、文档）以 [CC0-1.0](LICENSE) 释放到公有领域；`scripts/` 与 `docs/index.html` 的代码同样适用 CC0-1.0。被链接的项目保留各自的许可证。
