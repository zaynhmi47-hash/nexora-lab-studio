# Nexora AI — AGENT.md

## 1. Mission
Nexora AI is the ecosystem-wide AI workspace for conversational AI, multimodal input, files, projects, knowledge bases, agents, tools, research, coding, content generation, voice, automation, and collaboration.

## 2. Architecture
Use an AI Gateway abstraction. Providers such as Gemini or future models are adapters, not domain dependencies. The gateway should manage model selection, credentials, quotas, usage, cost tracking, safety policies, tool permissions, and observability.

## 3. Product concepts
- chats and conversations
- projects
- file/knowledge sources
- retrieval/RAG
- model routing
- prompts/instructions
- agent definitions
- tool registry
- automation
- usage/credits
- team/workspace controls
- voice/multimodal experiences

## 4. Agent safety
Agents must have explicit tools and scopes. Separate planning from execution. High-impact, financial, destructive, external, or irreversible actions require appropriate confirmation or policy checks. Tool calls must be auditable.

## 5. Privacy
Separate user input, retrieved context, stored project knowledge, provider output, and telemetry. Never expose API keys to clients. Do not retain sensitive prompts/files unless required by a clearly defined feature and policy.

## 6. AI-agent coding instructions
Never hard-code one provider's request format throughout the application. Add provider adapters and contract tests. Test quota exhaustion, provider failure, malformed model output, tool authorization, streaming interruption, and retries. Treat model output as untrusted data until validated.

# Detailed product concept

Nexora AI is the general AI workspace of the Nexora ecosystem: conversational AI, multimodal analysis, files, projects, knowledge bases/RAG, agents, tools, research, coding, content creation, voice and automation.

## Product concept

Users work inside projects and conversations rather than a single undifferentiated chat stream. A project may contain conversations, uploaded references, instructions, tools and reusable context. Knowledge retrieval must expose enough provenance for users to understand what material informed an answer.

## Core capabilities

- Chat and multimodal input/output.
- File upload, extraction and analysis.
- Projects and persistent workspace context.
- Knowledge bases, indexing, retrieval and RAG.
- Research workflows with source collection and synthesis.
- Coding assistance with explicit repository/tool permissions.
- Content generation and transformation.
- Agent definitions, tool selection, execution traces and approvals.
- Voice capabilities where supported.
- Automation with schedules/events and usage controls.

## Agent architecture

Agent lifecycle: definition → policy → planning → tool authorization → execution → observation → result/audit. Tool permissions must be explicit and scoped. Financial, destructive, external, irreversible or high-impact actions require confirmation or an approved policy gate.

## AI Gateway boundary

Nexora AI consumes the shared Core AI Gateway. Provider SDKs, credentials, routing, quotas, cost accounting and provider failures remain behind backend adapters. Never put provider secrets in mobile/web code.

## UX/navigation

Suggested shell: Home → Chats → Projects → Knowledge → Agents → Research → Files → Automations → Usage → Settings.

Conversation UI should clearly distinguish user input, model output, tool activity, citations/references, generated artifacts and failures. Streaming states must remain recoverable. Users need clear controls for model/context/tool selection where exposed.

Project pages should show context sources and permissions. Agent execution pages should show requested action, authorized tools, progress, result and failure/retry state without exposing secrets.

## Trust and safety

AI output is untrusted data. Validate structured outputs before application use. Retrieval must respect source permissions. Do not expose one user's/project's private files through retrieval. Tool calls must re-check authorization server-side. Maintain usage/cost limits and abuse controls.

## Data and privacy

Clearly communicate external processing when applicable. Minimize sensitive data sent to providers. Logs must avoid prompts/files/secrets unless explicitly required and protected. Deletion/export behavior must account for conversations, files, indexes and derived artifacts.

## Agent ownership

Frontend owns chat/project/agent UI and presentation. Backend owns AI orchestration, provider adapters, usage, quotas, retrieval, tool authorization, persistence and audit. Core owns shared identity, organization, authorization, files and AI gateway primitives.

## Definition of done

AI features require a provider boundary, permission model, data-flow description, usage limits, failure handling, prompt/tool validation, privacy consideration and tests.