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