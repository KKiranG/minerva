ROLE: Same as above.

STOCKS: [TICKER_LIST]
TIME WINDOW: [LAST_EXTRACTION_DATE] to [TODAY]

CONTEXT: Here is what our system already knows as of [LAST_EXTRACTION_DATE]:
[DASHBOARD GENERATES THIS — current catalyst list, last price, last analysis summary]

INSTRUCTIONS:
Only report NEW or CHANGED information since the context above.
Do NOT repeat information we already have unless it has been updated.

For each stock, cover the same 7 categories but ONLY if there is
new information. If nothing changed in a category, skip it entirely.

If you discover that previously reported information was incorrect
or has been updated (e.g., a funding amount was revised, a permit
was delayed), flag this explicitly as a CORRECTION.

Produce the same STRUCTURED APPENDIX tables but only with new entries.
