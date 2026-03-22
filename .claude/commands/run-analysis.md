---
name: run-analysis
description: Run the full agent pipeline for a stock
argument-hint: [TICKER]
---

Steps:
1. Read the most recent extraction for $ARGUMENTS from data/extractions/
2. Run the task generator: python scripts/run_agents.py --ticker $ARGUMENTS --generate-tasks
3. Execute all agents: python scripts/run_agents.py --ticker $ARGUMENTS --execute
4. Check output: ls data/agent_outputs/ | grep $ARGUMENTS | tail -20
5. Report which agents completed successfully and which had issues
