# Dignity Parent Application Foundation

This mobile application is the parent experience for Nexora Dignity. It is intentionally broader than the Academic/SIAKAD domain.

## Product model

Dignity connects six bounded domains through one privacy-aware Dignity Profile:

- Learn — formal and informal learning, practice and mastery.
- Academic — institutionally authoritative education records and workflows.
- Grow — personal discovery, goals, habits, reflection and wellbeing practices.
- Career — career exploration, competencies and portfolio evidence.
- Research — research projects, supervision and outputs.
- AI — cross-domain assistance with explicit privacy and authority boundaries.

The product supports the recurring cycle:

Discover → Assess → Design → Learn → Practice → Reflect → Improve → Demonstrate → repeat.

The ten development pillars are defined in `docs/product/DIGNITY_PRODUCT_VISION.md` and surfaced in Discover. They are lenses for self-directed development, not scores, rankings or diagnoses.

## Mobile navigation

The primary mobile navigation is deliberately limited to five destinations:

1. Home — personalized entry point, development cycle and domain shortcuts.
2. Discover — ten development pillars and self-discovery entry point.
3. Grow — goals, sustainable practice and private reflection.
4. Learn — evidence-informed learning methods and domain entry points.
5. Profile — unified identity and evidence context, privacy boundaries and account actions.

Academic, Career, Research and AI Mentor are secondary domain destinations reachable from Home/Learn/Profile, not competing primary tabs.

## Boundaries

- A Dignity Profile aggregates domain references and summaries; it does not merge source-of-truth records or grant blanket access.
- Grow reflections are private by default and are not exposed to institutions by virtue of enrollment.
- Learning activity, mastery evidence and official academic credit remain distinct.
- Academic records require institution authority, lifecycle, permissions and audit.
- AI assistance is not a clinical diagnosis or institutional decision-maker.
- AI cannot silently alter grades, attendance, KRS, enrollment or other official records.

## Implementation status

This PR establishes the mobile parent shell, shared visual tokens/components, primary navigation, domain landing pages and first-pass screen experiences. The authenticated organization membership list is loaded from the Nexora organization API and can be selected as a navigation preference. This selection does not bypass server-side authorization or imply that every domain endpoint is organization-scoped. Grow goal/reflection interactions are local previews only. Persistent Grow storage, learning catalogs, Career/Research workflows, AI provider integration and domain-specific API connections are intentionally not represented as complete in this foundation PR.

## Next vertical slices

1. Connect Dignity Profile and organization context to authenticated API contracts.
2. Build Learn catalog/course/lesson/attempt/progress with clear mastery evidence.
3. Build Grow discovery, goals, habits and private journal APIs with privacy controls.
4. Continue Academic workflows as one bounded domain (not as the parent app).
5. Build Career and Research workflows.
6. Integrate AI through explicit consent, evidence-aware context and privacy filtering.
