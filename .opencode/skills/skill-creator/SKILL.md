---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

## Core Process

1. **Capture Intent** — Understand what the user wants the skill to do
2. **Interview & Research** — Ask about edge cases, input/output, success criteria
3. **Draft SKILL.md** — Write with YAML frontmatter (name, description) + markdown body
4. **Test** — Create test prompts, run them, evaluate results
5. **Iterate** — Improve based on feedback, repeat

## SKILL.md Structure

```
.opencode/skills/<skill-name>/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable scripts for deterministic tasks
    ├── references/ - Docs loaded as needed
    └── assets/     - Templates, icons, fonts
```

## Writing Guide

### YAML Frontmatter
```yaml
---
name: <kebab-case-identifier>
description: |
  Concise description of what the skill does and when to trigger.
  Be slightly "pushy" — include specific contexts and phrases that
  should trigger this skill. Max ~200 words.
---
```

### Body Writing Patterns
- Use imperative tone
- Keep under 500 lines; use progressive disclosure for large skills
- Reference bundled files with clear guidance on when to load them
- Explain **why** things matter, not just what to do
- Prefer reasoning over rigid MUSTs/ALWAYS/NEVER
- Include examples for key patterns

### Trigger Description Design
Describe both *what* the skill does AND *when* to use it. Include:
- Specific user phrases that should trigger
- Adjacent contexts where it's useful
- Counter-examples (when NOT to trigger)

## Test & Evaluate

### Creating Test Cases
Save as `evals/evals.json`:
```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

### Evaluation Workflow
1. Create 2-3 realistic test prompts
2. Run them with the skill active
3. Run baselines (without skill, or with previous version)
4. Compare results qualitatively and quantitatively
5. Iterate based on feedback

## Description Optimization

Generate trigger eval queries (20 items: 10 should-trigger, 10 should-not-trigger). Focus on:
- **Should-trigger**: Different phrasings, casual/formal, edge cases, adjacent contexts
- **Should-not-trigger**: Near-misses, keyword overlaps but different intent, ambiguous scenarios

## Multi-Domain Skills

When a skill supports multiple domains/frameworks, organize by variant:
```
skill-name/
├── SKILL.md (workflow + selection guidance)
└── references/
    ├── variant-a.md
    ├── variant-b.md
    └── variant-c.md
```
