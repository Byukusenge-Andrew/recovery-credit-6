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

---

# UI Design Standards & Anti-AI-Slop Rules

All agents and assistants designing, building, or modifying front-end interfaces, dashboards, visualizers, or web components must strictly adhere to these standards:

### 1. Zero "AI Slop" Emojis & Cliches
- **No Emojis as UI Icons**: Never use emojis (🚀, ✨, 💡, 🔥, ⚡, 🤖, 📈, etc.) as icons, button ornaments, badge decorations, or category labels.
- **Use Real Icons**: Use clean, crisp SVG icon sets (Lucide, Heroicons, Radix Icons, or clean inline SVGs) with consistent stroke widths (1.5px–2px).
- **No Fluff Marketing Copy**: Avoid generic buzzword titles like *"Supercharge Your Workflow with AI ✨"* or fake stat cards (*"99.9% Efficiency"*). Keep headings descriptive, concise, and focused on function.

### 2. Restrained Elevation (No Heavy Highlight Shadows or Neon Glows)
- **Eliminate Neon / Glowing Box Shadows**: Do NOT use exaggerated colored glows, diffuse multi-layer highlight halos (`box-shadow: 0 0 35px rgba(...)`), or neon backdrops.
- **Crisp, Subtle Borders**: Define structure with crisp, low-contrast 1px borders (`border: 1px solid var(--border)` / subtle slate/neutral tints) rather than relying on shadow blur.
- **Realistic Functional Shadows**: Limit shadows to subtle, natural elevation:
  - Small / subtle: `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);`
  - Floating / modal: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);`
- **No Gimmicky Glassmorphism**: Avoid excessive frosted glass (`backdrop-filter: blur(...)`) with translucent text that compromises contrast or readability.

### 3. Purposeful Color Palette (No Purple/Cyan Gradient Slop)
- **Ban Generic AI Gradients**: Avoid default purple-to-pink or violet-to-cyan diagonal gradients across headers, cards, and buttons.
- **Disciplined Palette**: Use deep, neutral dark mode backgrounds (slate/zinc/neutral charcoals like `#09090b`, `#0f172a`, or `#121212`) or clean light surfaces.
- **Controlled Accents**: Use accent colors selectively for primary CTAs and active states, never painted arbitrarily across whole card surfaces.

### 4. High Information Density & Typography
- **Dense, Functional Layouts**: Prefer compact, scannable data layouts (clear data tables, structured definition lists, split view master-detail panels) over giant empty cards with huge padding.
- **Crisp Typography Hierarchy**: Use modern sans-serif typefaces (Inter, Outfit, Geist, system font stack). Maintain clear hierarchy through weight (`500` / `600`) and size rather than excessive color variation.

### 5. Intentional Micro-interactions
- **No Infinite Shimmers or Floating Elements**: Do not use continuously pulsing badges, looping glowing borders, or floating elements.
- **Snappy Transitions**: Keep hover/active transitions fast and functional (150ms–200ms `ease-out`).
