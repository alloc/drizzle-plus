---
name: lildocs
description: Use when authoring, reviewing, or restructuring Markdown documentation, especially docs architecture, page purpose, examples, technical-writing quality, and docs-change review.
---

# Technical Documentation

> Help readers make correct decisions quickly: organize around tasks and concepts, state boundaries plainly, and prove claims with concrete examples.

## Read the Project

Base documentation on the current project's facts, vocabulary, and support
boundaries:

- existing docs and README
- docs root, folder layout, and generated navigation
- package scripts and CI workflows
- guides and fixtures used by the project
- configuration, theme, font, and asset files

When publishing behavior matters, verify it from the installed package docs or
source before writing about it:

```text
node_modules/lildocs/docs/
node_modules/lildocs/
```

Use published docs only when local package docs are unavailable:

```text
https://aleclarson.github.io/lildocs/
```

Treat generated-site constraints as content constraints: folder-based
navigation, static links, headings and anchors, local search, diagrams, and
assets all affect how readers find and trust the docs.

## Page Purpose

Give each page one durable job. Before drafting, decide what the reader is
trying to do, what they already know, what decision the page must support, and
where they should go next.

For new pages in this project, follow the H1 with a purpose blockquote unless
nearby docs use a different contract. The blockquote should clarify the page's
real job: the decision it supports, the task it helps complete, or the boundary
it draws.

```md
# Command Line

> Build, preview, and publish flows start from different commands; this page
> keeps their flags and defaults separate so scripts stay small.
```

Weak purpose blocks restate the title or promise generic learning.

```md
# Configuration

> Learn about configuration.
```

Prefer direct clarity over page-navigation language.

```md
# Configuration

> Persistent site defaults belong in `config.json`; one-off choices belong in
> CLI flags for the current build or preview command.
```

## Information Architecture

Organize docs by reader movement, not by source-code ownership. A useful docs
set has a few clear shapes:

- **Overview**: names the system, its moving parts, and the first meaningful
  decisions.
- **Task guides**: complete a workflow from prerequisite to successful result.
- **Concept guides**: explain boundaries, tradeoffs, and mental models.
- **Reference**: supports lookup with complete, scannable facts.
- **Troubleshooting**: starts from symptoms and leads to verification.

Put concepts at the point where readers need them. If a concept is needed by
many pages, give it a canonical home and link to it instead of redefining it in
each workflow.

Use file and folder names as navigation labels. Prefer short, stable nouns for
concept areas and action-oriented names for workflows:

```text
docs/
  index.md
  getting-started.md
  guides/
    publish.md
    customize-theme.md
  concepts/
    navigation.md
  troubleshooting.md
```

Keep prerequisite information before the steps that depend on it. Keep
conceptual tradeoffs before the choice they influence. Put warnings immediately
before the action they can change.

## Mermaid Diagrams

Use a Mermaid diagram when visual structure helps the reader understand a
relationship they would otherwise need to reconstruct from prose. Diagrams are
especially desirable for:

- workflows with meaningful branches, parallel steps, or feedback loops
- lifecycle states and the transitions allowed between them
- dependencies, ownership boundaries, or handoffs among several components
- request or message sequences involving multiple actors
- architecture overviews where grouping and connection are the point

Prefer `flowchart` for workflows, dependencies, and architecture;
`sequenceDiagram` for interactions over time; and `stateDiagram-v2` for
lifecycle transitions. Keep each diagram focused on one idea, use short labels,
and introduce it with prose that tells the reader what relationship to notice.

Do not add a diagram merely to decorate a page or restate a short linear list,
definitions, headings, or a comparison that a table communicates more clearly.
If layout, direction, grouping, or connection carries no additional meaning,
use prose, a list, or a table instead.

## Callouts

lildocs supports GitHub-style Markdown callouts. Use them when a detail changes
how the reader should interpret or perform the surrounding task:

- `NOTE`: useful context that prevents confusion but does not change the task
- `TIP`: optional advice that improves the result or saves time
- `IMPORTANT`: required information that readers must know before continuing
- `WARNING`: risk, data loss, compatibility, or irreversible action to check
- `CAUTION`: hazardous or easy-to-misuse behavior that needs extra restraint

Keep callouts close to the step, option, or concept they affect. Do not use a
callout for ordinary prose, page summaries, or content that belongs in the main
flow.

```md
> [!NOTE]
> Search indexes are generated at build time, so changed pages require a new
> build before local search reflects them.

> [!WARNING]
> Delete the output directory only when it contains generated site files.
```

## Public API Documentation

When documentation touches TypeScript library APIs, keep factual API behavior
near the source instead of creating hand-maintained `docs/reference/` prose.

Default to this source-of-truth model:

- public TSDoc owns symbol behavior, parameters, returns, errors, invariants,
  side effects, deprecations, and related APIs
- `docs/guides/` owns usage, composition, common workflows, and preferred
  defaults when those patterns belong in dedicated guide pages
- concept docs own mental models, lifecycle, terminology, API-selection
  guidance, stable patterns, and anti-patterns
- generated declarations own exact signatures and module shape

Treat the published surface as public:

- package export-map entrypoints
- source entry files intended for consumers
- symbols reachable from generated declaration files
- documented re-exports intended as API

Every public export should have at least a useful TSDoc summary. Add detailed
tags when they clarify real behavior:

- `@param`
- `@returns`
- `@throws`
- `@example`
- `@remarks`
- `@deprecated`
- `@see`

Do not document internal helpers as public API unless they are intentionally
exported. If declarations expose internal-only symbols, prefer fixing the
package boundary over documenting the leak as official API.

## Writing Quality

Lead with the reader's next decision or action, then provide the smallest
command, config, file tree, table, or Markdown pattern that completes it.

Prefer observable outcomes over vague benefits.

```md
Weak:
This makes publishing easier.

Strong:
`pnpm run docs:build` writes static files to `./site` for CI to upload.
```

Keep terminology stable across pages. Change terms only when the distinction
helps readers make a different decision.

```md
Use `docs root` consistently.
Avoid switching between `source folder`, `content folder`, and `docs directory`
unless each term has a distinct meaning.
```

Use parallel structure when comparing options, fields, commands, or states. A
table is often better than prose when readers need to scan for defaults,
constraints, or differences.

```md
| Option | Applies to | Default | Notes |
| --- | --- | --- | --- |
| `--out <dir>` | build, dev | `dist` | Directory for generated files. |
```

Qualify claims where the boundary matters. Prefer "when X, use Y" over broad
rules that become false on the next page.

## Example Discipline

Every non-trivial concept needs a nearby example. Non-trivial concepts include
commands, config, file layout, Markdown syntax, workflow steps, API shapes,
generated output, and errors.

Strong examples have four parts, even when some are only one sentence:

- the situation that makes the example relevant
- the smallest realistic input
- the command, config, or content to use
- the observable result or next check

````md
Set a build output directory when CI expects artifacts in `./site`:

```bash
pnpm run docs:build -- --out ./site
```

After the command finishes, CI can upload `./site` as a static artifact.
````

For prose concepts, use before/after snippets rather than abstract advice.

```md
Weak:
The build failed.

Strong:
The build failed because `docs/config.json` contains invalid JSON.
```

Example comments may explain intent, but they cannot carry information the
surrounding prose omits. Use `jsonc` for JSON examples with comments so the
comments are syntax highlighted correctly.

```jsonc
{
  "navigation": {
    // Keep the getting-started page before generated folder entries.
    "order": ["getting-started.md", "guides/"]
  }
}
```

## Reference Pages

Product reference pages should be complete inside their stated boundary and
optimized for lookup speed. Put the boundary at the top, then use consistent
tables, short subsections, and examples only where readers might choose
incorrectly. For TypeScript API reference, prefer public TSDoc plus generated
declarations over hand-maintained reference pages.

For commands, include syntax, required arguments, defaults, side effects,
generated files, and failure cases that change user action.

For configuration, include field name, type, default, allowed values, merge or
precedence behavior, and a minimal complete example.

For errors, start with the symptom, then list likely causes, verification
steps, and the smallest fix that resolves each cause.

## Review Checks

Before finishing docs changes, verify that:

- each changed page has one clear reader job
- navigation follows reader tasks rather than implementation trivia
- duplicated explanations have a canonical home
- claims are grounded in project files, tests, package docs, or source
- every non-trivial concept has a nearby example
- guide examples use project-realistic names, paths, and commands
- links, headings, anchors, diagrams, and assets work in the generated site
- terminology is consistent across changed pages

Run the project's available checks, such as formatting, linting, typechecking,
tests, or a local docs build.
