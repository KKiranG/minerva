---
name: minerva-format
description: Consolidate multi-model research into MINERVA format
argument-hint: [TICKER or file path]
---

Read all research material provided: pasted text, files, or clipboard.

Your job is to produce a single MINERVA-formatted report following the
exact specification in `prompts/minerva_format_spec.md`.

Rules:
1. Read `prompts/minerva_format_spec.md` first to understand the exact format.
2. Deduplicate: if multiple sources report the same catalyst or event,
   keep one entry with the most complete data.
3. Reconcile: if sources disagree, note disagreements in `NARRATIVE` and
   use the most authoritative source for table values.
4. Analyse: the `NARRATIVE` should synthesise sources into a coherent
   investment thesis, not just concatenate snippets.
5. Decide: the `DECISION` table must contain a clear verdict with all fields.
   If the evidence is genuinely insufficient, use `NEUTRAL / WATCH`.
6. Be thorough in `NARRATIVE` because this is where the analysis depth lives.
7. Be precise in tables because they feed directly into the database.
8. Include `TRIPWIRES`: what invalidates, what confirms, what to watch.
