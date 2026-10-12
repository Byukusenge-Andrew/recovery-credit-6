<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Context & Change Tracking Instructions

> [!IMPORTANT]
> **Token Preservation Rule**: Do NOT re-read or scan entire codebase source files indiscriminately.
> Instead, read `.aicontext/SUMMARY.md` for complete codebase architecture, symbol maps, and connection graphs.

## Instructions for AI Assistant

1. **Context & Architecture Discovery**:
   - Read `.aicontext/SUMMARY.md` to understand all available modules, classes, functions, and import relationships in ~2,000 tokens.
   - Inspect `.aicontext/recent_changes.md` to see recent modifications and impact radius.

2. **Self-Updating Context (0 LLM Tokens Burned)**:
   - Whenever you create, modify, or delete files in this project, execute `aicontext sync` (or invoke the `sync_context` MCP tool).
   - *Note: `aicontext sync` executes 100% locally on CPU via fast AST/hash parsing. It uses 0 LLM API tokens.*

3. **Impact Radius Verification**:
   - Before suggesting edits to shared modules, check `.aicontext/recent_changes.md` or use `get_impact_radius` to verify which downstream dependent files are affected.
