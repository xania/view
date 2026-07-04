---
name: question-scope-guard
description: Use this skill whenever the user asks a narrow coding question, bug fix, code review, refactor, or implementation task and wants Codex to stay strictly within the requested scope. Prevents opportunistic fixes, broad cleanup, related refactors, production-hardening, new helper creation, or test-driven scope expansion.
---

# Question Scope Guard

## Purpose

The goal of each prompt is to make one small, controlled step toward better code.

Do not try to make the code production-ready in a single response.

Do not treat the prompt as permission to complete the entire surrounding feature, fix all related issues, improve the architecture, clean up nearby code, or make the full test suite green.

A successful result is:

- a small, understandable change,
- limited to the requested scope,
- easy to review,
- easy to revert,
- with no surprise edits.

Prefer an incomplete but correctly scoped change over a broad “complete” solution that changes more than requested.

## Core rule

Only do the work explicitly requested by the user.

The user's question defines the boundary of the task.

Do not fix, refactor, rename, simplify, modernize, reformat, or improve code outside the exact scope of the user's question, even when:

- the related code looks wrong,
- tests fail because of unrelated or pre-existing issues,
- nearby code is messy,
- another fix would be obvious,
- a broader refactor would be cleaner,
- a new helper function would make the code look cleaner,
- the requested change exposes another problem,
- the implementation would be more elegant with a larger change,
- the code would not yet be production-ready without more work.

## Required workflow

Before editing files:

1. Restate the requested scope in one or two sentences.
2. Identify the minimal existing files/functions likely needed.
3. State what is explicitly out of scope.
4. Make only the smallest useful change that satisfies the request.

## During implementation

- Prefer surgical edits over broad rewrites.
- Prefer changing existing code in place over introducing new structure.
- Do not create new functions, helpers, classes, files, abstractions, or modules unless the user explicitly asks for them.
- Do not modify unrelated files.
- Do not update snapshots, formatting, generated files, dependencies, configs, or tests unless the user specifically asked for that.
- Do not chase failing tests outside the requested scope.
- Do not fix lint, type, or test failures that are not caused by your change.
- Do not clean up while you are there.
- Do not convert patterns, rename APIs, reorganize folders, or change architecture unless directly requested.
- Do not add validation, abstractions, retries, caching, logging, error handling, tests, test rewrites, dependency upgrades, or refactors unless explicitly requested.
- Do not continue improving the code after the requested change is done.

## Controlled incremental improvement

When solving a task:

1. Identify the smallest useful improvement that answers the prompt.
2. Make that change only.
3. Stop.
4. Report any related issues separately instead of fixing them.

The user is intentionally working in small steps.

Respect that workflow.

Each prompt should move the codebase forward by one controlled step, not attempt to finish the destination.

## When tests fail

If tests fail after the scoped change:

1. Determine whether the failure is caused by your change.
2. If yes, fix only the direct cause.
3. If no, report the failure as out of scope and leave it unchanged.
4. Do not patch unrelated failing tests just to get a green run.

Use wording like:

> The following test failure appears unrelated to the requested change, so I did not modify it.

## When you notice related issues

If you see a related issue outside the requested scope, mention it briefly in the final response under “Not changed” or “Follow-up option.”

Do not fix it unless the user explicitly asks.

## Final response format

Include:

- Requested scope
- What changed
- Files changed
- Tests/checks run
- Unrelated failures or issues intentionally left untouched
- Suggested follow-up, clearly marked as not done

## Hard stop rule

If the next edit would require changing behavior outside the user's question, stop and ask for permission instead of making the edit.