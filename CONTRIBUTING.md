# Contributing

This is an unofficial community list, not affiliated with T3 Code or its maintainers. It exists so that, if an official plugin API arrives, the ideas people already asked for can be found quickly and ranked by demand.

## What gets collected

An idea is a request or use case that someone already described in **public**, for example in an upstream discussion or a public repository. Each entry needs:

1. **At least one public https source with its date.** Quote or summarize it faithfully. Do not paste private messages, emails, chat logs, company material or anything you were not free to share.
2. **A restrained problem statement** of one or two sentences. If the demand comes from a single post, say so; do not write "many users want".
3. **Demand with a date.** The upvote count of the source discussion or comment, and the day you read it. Counts are not added across sources.
4. **A mount today**, one of the values below, with one sentence saying why.

Before posting, search the issues, and check whether T3 Code already ships it. On 2026-11-19 the upstream user docs on `main` describe scheduled tasks ([project-settings.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/project-settings.md)), thread snooze ([thread-sidebar.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/thread-sidebar.md)), math rendering ([appearance.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/appearance.md)), usage limits on the thread details card ([usage.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/usage.md)) and a suggested next prompt in Labs ([composer.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/composer.md)), so related requests are not collected as open ideas. A request whose upstream discussion was closed is not collected unless you can say why.

## Mount today: official open entries only

`mount_today.type` says which official entry could carry a minimal version **now**. It is a factual claim, so every value other than `needs-plugin-api` must rest on a sentence in the official docs or on a verified existing project; otherwise use `needs-plugin-api`, or say "untested".

| Value | Official entry | Docs |
| --- | --- | --- |
| `custom-css` | A theme's Custom CSS, applied after T3's own styles; no `@import`, `image-set()` or external `url()` | [appearance.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/appearance.md) |
| `mcp` | An MCP server you add to a provider, or T3's own MCP server used by an outside agent or companion app | [outside-agents.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/outside-agents.md), [composer.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/composer.md), [html-renders.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/html-renders.md) (MCP apps) |
| `skill` | A Skill the provider loads, listed in the `$` picker | [composer.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/composer.md) |
| `standalone-page` | A separate web page or app that connects through MCP or the `t3` command line | [outside-agents.md](https://github.com/pingdotgg/t3code/blob/main/docs/user/outside-agents.md) |
| `needs-plugin-api` | None of the above can carry it today | none |

Not accepted as a mount: injecting into or editing the app's ASAR package, patching the installed app, or changing its hashes or signature. T3 Code is open source (MIT) and already has Custom CSS, so a supported route exists; patches break on each nightly update, and a modified app sends the maintainers bug reports they cannot reproduce. Projects that work this way are not listed, though an idea they illustrate can be.

## How to submit

- **A new idea:** open an issue with the "Plugin idea" form. A maintainer may edit it or close it with a reason when it lacks a public source or breaks the rules above.
- **A change to the seed list:** edit `ideas/ideas.json`, then run `node scripts/check.mjs --fix` and `node scripts/check.mjs`. The check validates required fields, https sources, unique slugs and mount values, and keeps the page snapshot in sync.
- **A project for [works-today.md](works-today.md):** it must use an official open entry, be usable without replacing the app, and have its license and any non-affiliation statement read from the repository on the day you submit.

## Please don't

- Post this list into upstream discussions or ping upstream maintainers about it; upstream's own contribution rules discourage repeated pings.
- Use T3 Code's logo, download links or wording that suggests the list is official.
