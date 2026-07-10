# Workspace Rules: Superpowers & Design Enforcement

You MUST follow the Superpowers development methodology and high-fidelity frontend design standards for all tasks in every session.

<EXTREMELY_IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY_IMPORTANT>

<CRITICAL_SYSTEM_RULES>
- NO ARBITRARY CHANGES: You are strictly forbidden from making important code changes, edits, or taking actions without the user's explicit prior consent and confirmation.
- GIT PUSH BEFORE ANY TASK: Before making any modifications, writing code, or starting a task, you must ensure all current workspace changes are committed and pushed to git. If git remote information is missing, ask the user for the repository details.
- GIT PUSH AFTER EVERY TASK: Upon completing a task or modification, you must stage, commit, and push the changes to git immediately. This ensures a rollback path is always preserved.
- DO NOT GUESS: Never guess or assume requirements. If details are missing or unclear, ask the user first.
</CRITICAL_SYSTEM_RULES>

## The Core Rule

1. **Invoke relevant or requested skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files. If a skill turns out wrong for the situation, you do not have to use it.
2. **Before entering plan mode**: if you haven't already brainstormed, invoke the `superpowers:brainstorming` skill first.
3. **Announce your action**: Say "Using [skill] to [purpose]" and follow the skill exactly.
4. **Task Tracking**: Create a task artifact (markdown checklist saved to `<appDataDir>/brain/<conversation-id>/task_list.md` with `IsArtifact: true` and `ArtifactMetadata.ArtifactType: "task"`) to track each step of your plan. Check off items (`- [x]`) as you complete them. Do NOT use `manage_task` for checklists.

## Skill Priority

When multiple skills apply, process skills come first:
- For feature requests/changes: Use `superpowers:brainstorming` first, then design, then implementation.
- For bug fixes: Use `superpowers:systematic-debugging` first.

## Frontend & UI/UX Standards: Stop Generic AI UI Output

When building or refining any frontend interfaces, components, or styles, you MUST:
1. **Ban Generic AI Defaults**: Do NOT default to Inter font, neutral/cool grays, 8px border-radius, and flat layouts.
2. **Apply Design Taste**: Choose a distinct design lane (e.g., minimalist, brutalist, soft, editorial, magazine stack) from `taste-skill` and `frontend-design`.
3. **Lock the Brand Palette First**: Define a clear typography hierarchy and a color palette with at most 1–2 accents BEFORE writing the first line of CSS/style code.
4. **Use Rich Visual Elements**: Use gradients (mesh, linear), custom backgrounds (noise, grain, hatch), and purposeful shadows to create depth.
5. **Accessibility & Semantics**: Ensure exactly one `h1`, proper heading hierarchy, focus styles, ARIA roles, contrast AA+, and reduced-motion fallback.
