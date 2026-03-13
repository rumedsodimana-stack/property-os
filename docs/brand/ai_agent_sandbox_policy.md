# AI Agent Hard Sandbox Policy

Version: 1.0  
Scope: Hotel Singularity OS (System, Concierge, Brand, Ops agents)

This policy enforces hard runtime controls so AI agents can be trained by brand standards without breaking system integrity.

## Guardrails

- All intents are validated before execution.
- Each agent has an action allowlist.
- Code modification actions are path-restricted and extension-restricted.
- Sensitive paths are blocked (`.env`, `.git`, `node_modules`, `dist`, kernel internals).
- Oversized or empty code payloads are rejected.

## Defense In Depth

- UI/intent layer validation (`agentSandbox`).
- Runtime execution validation (`sovereignDrive`).
- File modification validation + auto rollback (`fileModifier`).
- Server-side kernel validation (`edgeNode/kernel.mjs`) for write/read endpoints.

## Agent Capability Boundaries

- `SYSTEM`: operational actions + controlled code edits.
- `CONCIERGE`: navigation and task recommendations/limited task creation.
- `BRAND`: brand updates and navigation.
- `OPS`: operations tasks, troubleshooting, and navigation.

## Brand Training Model

- Default behavior baseline comes from `docs/brand/default_ai_agent_brain.md`.
- Client-specific brand brain can be uploaded as markdown/text (`system_doc`) via Brand Standards.
- Uploaded brain content is applied as custom prompt overlay for all agents.

