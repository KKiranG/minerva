---
name: data-pipeline
description: >
  Use when building or modifying the extraction ingest, task generation,
  agent execution, output parsing, or pipeline orchestration. Triggers on:
  pipeline, extraction, ingest, parse, agent execution, task generation,
  orchestrator, Ollama, run analysis.
---

# Data Pipeline Skill

## Pipeline Phases (always in this order)
A: Extraction -> B: Task Generation -> C: Agent Execution ->
D: Local Review -> E: Frontier Review -> F: Storage

## Phase A: Extraction Ingest
- Input: pasted text from frontend textarea
- Parser splits: free-form research -> research_notes table,
  structured appendix tables -> catalysts, price_snapshots,
  upcoming_events tables
- Every item gets an extraction_id linking back to the extraction record
- Deduplication: before inserting a catalyst, check for existing entry
  with same ticker + date + title. If exists, update rather than duplicate.

## Phase B: Task Generation
- Runs locally via Python (NOT a frontier model call)
- Reads: new data since last run from all tables for the target stock
- Applies: analytical templates for each of the 8 agents
- Writes: task files to data/tasks/[RUN_ID]/
- Each task file is self-contained: includes all data the agent needs

## Phase C: Agent Execution
- Sequential: Agent 1 finishes before Agent 2 starts
- Each agent: load system prompt + task file -> send to Ollama -> capture output
- Timeout: 120 seconds per agent call (kill and retry once if exceeded)
- Output stored: raw text + attempted JSON parse of structured fields
- If parse fails: store raw with parse_status='FAILED', do not block pipeline

## Phase D: Local Review
- Consistency Checker reads all 8 outputs, produces issue list
- Synthesis Agent reads all 8 outputs + issues, produces consolidated doc
- Both run on Ollama, same sequential model

## Phase E: Frontier Review
- Dashboard generates the senior review prompt with consolidated doc
- User copies to Claude/Gemini, pastes result back
- Parser extracts final decision fields

## Phase F: Storage
- All outputs stored in agent_outputs table with run_id linking
- Final decision fields denormalised into analysis_runs table for quick query
- Stock profile updated: current_verdict, current_conviction, last_full_analysis

## Ollama Integration
- Endpoint: POST http://localhost:11434/api/chat
- Model: "qwen3.5:latest" (configurable in config.py)
- stream: false (wait for complete response)
- Temperature: 0.3 for analytical agents (low creativity, high consistency)
- Max tokens: 4096 per agent call

## Error Handling
- If Ollama is unreachable: log error, skip agent, continue pipeline
- If agent output is unparseable: store raw, flag, continue
- If consistency checker finds critical errors: flag run, still produce synthesis
- Never halt the pipeline on a single agent failure

## Anti-Patterns
- Never send all 9 stocks to one agent in one call (one stock per call)
- Never run agents in parallel (Ollama is single-threaded)
- Never skip the consistency checker
- Never store parsed data without also storing the raw output
