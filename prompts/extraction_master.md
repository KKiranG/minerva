ROLE: You are a senior research analyst covering U.S. critical minerals
and rare earth equities. Produce a comprehensive intelligence extraction
for a swing-trading decision system.

STOCKS: [TICKER_LIST]
TIME WINDOW: [START_DATE] to [END_DATE]
CUSTOM FOCUS: [OPTIONAL — any specific areas to emphasise]

INSTRUCTIONS:
Cover ALL of the following for EACH stock. If nothing is relevant in a
category, say "No developments" — do not omit the category.

CATEGORY 1: GOVERNMENT & POLICY
— New/updated government funding (specify: agency, instrument, amount,
  binding status, cost share, identifiers if available)
— Export control changes (US, China, allies)
— Procurement mandates or bans
— Strategic reserve actions
— Permit/regulatory developments
— Legislative/executive actions
— Congressional hearings
Include dates, amounts, instrument types, binding status.

CATEGORY 2: COMPANY SPECIFIC
— Financial results, guidance
— Capital raises, debt, convertible notes (specify terms)
— Dilution events
— Management changes
— Partnerships, JVs, offtakes
— Operational milestones
— Legal issues
— Insider transactions
— Analyst coverage changes (upgrades, downgrades, price targets with firm name)

CATEGORY 3: TECHNICAL & PRICE ACTION
— Price performance (% change, key moves)
— Volume (above/below average, spikes)
— Support and resistance levels
— Moving average position (50d, 200d)
— Patterns (breakouts, breakdowns, gaps)
— Relative strength vs peers

CATEGORY 4: OPTIONS & POSITIONING
— Unusual options activity
— P/C ratio
— Notable OI at specific strikes
— Speculative flow signals
(If no options data available, state that)

CATEGORY 5: COMMODITY & SECTOR
— Rare earth prices (NdPr, HRE), tungsten (APT), antimony,
  uranium (spot/term), gallium/germanium
— Supply chain developments
— China actions (production, exports, policy, stockpiling)
— Allied country actions

CATEGORY 6: SENTIMENT & NARRATIVE
— Financial media narrative
— Social media (Reddit, X, StockTwits)
— Retail vs institutional signals
— Meme/momentum activity
— Analyst commentary

CATEGORY 7: UPCOMING EVENTS (30-day forward)
— Earnings dates
— Permit decisions
— Funding decisions
— Policy milestones
— Production milestones
— Options expiry dates
— Conferences, investor days
— Hearings, votes

OUTPUT: Organise by STOCK, then by CATEGORY. End with a SECTOR OVERVIEW.

STRUCTURED APPENDIX:
After your research, produce these tables at the end of your response:

NEW_CATALYSTS table:
| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance_1to5 | Source |

PRICE_SNAPSHOTS table:
| Ticker | Close | Change_Pct | Vol_vs_Avg | Above_50MA | Above_200MA | Key_Level |

UPCOMING_EVENTS table:
| Date | Ticker | Type | Description | Impact | Source |

OPTIONS_NOTABLE table:
| Ticker | Call_or_Put | Strike | Expiry | Volume | OI | Notes |

Be thorough. Follow leads. Include dates and numbers. Flag uncertainty.
