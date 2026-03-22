---
name: prompt-engineering
description: >
  Use when building or modifying prompt generation, template management,
  or frontier model interaction components. Triggers on: prompt, template,
  extraction prompt, task decomposition, system prompt, frontier model.
---

# Prompt Engineering Skill

## Prompt Template Structure
Every generated prompt follows this structure:
1. ROLE — who the model is (1 paragraph)
2. CONTEXT — all data the model needs (from database)
3. TASK — specific instructions (numbered, precise)
4. FORMAT — exact output specification
5. CONSTRAINTS — what NOT to do

## Context Injection
When generating prompts, pull from SQLite:
- Stock profile (from stocks table)
- Recent catalysts (from catalysts table, last 90 days)
- Last analysis (from agent_outputs, most recent run)
- Current positions (from trading_journal where status='OPEN')
- Upcoming events (from upcoming_events where status='UPCOMING')
- Last price snapshot (from price_snapshots, most recent)

## Delta Mode
When generating a delta extraction prompt:
- Include a summary of what's already in the database
- Specify the date range (last extraction date to today)
- Explicitly ask only for NEW or CHANGED information
- Include a CORRECTIONS section for updated information

## Prompt Size Management
- Extraction prompts: can be long (frontier models handle it)
- Agent task files: keep under 2000 words (Qwen context = 32K tokens,
  but quality degrades with excessive input)
- Senior review prompts: consolidated doc should be under 3000 words

## Anti-Patterns
- Never generate a prompt without injecting current database state
- Never hardcode dates — always use the current date dynamically
- Never include the full extraction in an agent task (extract only relevant portions)
- Never generate a prompt without the output format specification
