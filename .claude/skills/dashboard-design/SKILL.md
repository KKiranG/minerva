---
name: dashboard-design
description: >
  Use when building or modifying any frontend component, page layout,
  or visual design element. Triggers on: dashboard, page, component,
  card, panel, chart, timeline, UI, frontend, display, layout.
---

# Dashboard Design Skill

## Visual Design System

### Colour Palette (defined in frontend/src/utils/colors.js)
Background: #0f1117 (near-black)
Card background: #1a1d2e (dark blue-grey)
Card border: #2a2d3e (subtle border)
Text primary: #e4e4e7 (off-white)
Text secondary: #9ca3af (grey)
Text muted: #6b7280 (darker grey)

Verdict colours:
- BULLISH: #22c55e (green-500)
- BEARISH: #ef4444 (red-500)
- NEUTRAL: #eab308 (yellow-500)
- WATCH: #3b82f6 (blue-500)

Significance colours:
- 5 (stock-moving): #ef4444 (red)
- 4 (significant): #f97316 (orange)
- 3 (moderate): #eab308 (yellow)
- 2 (minor): #6b7280 (grey)
- 1 (noise): #374151 (dark grey)

Catalyst category colours:
- GOV_FUNDING: #3b82f6 (blue)
- EXPORT_CONTROL: #ef4444 (red)
- EARNINGS: #22c55e (green)
- DILUTION_EVENT: #f97316 (orange)
- OPERATIONAL: #8b5cf6 (purple)
- (others: #6b7280 grey)

### Layout Principles
- Max content width: 1400px, centered
- Card grid: responsive — 3 columns on desktop, 2 on tablet, 1 on mobile
- Padding: p-4 for cards, p-6 for page containers
- Border radius: rounded-lg for cards, rounded-md for buttons
- Shadows: shadow-lg on hover for interactive cards

### Information Hierarchy
- Level 1 (always visible): verdict badge, conviction dots, price, one-line
- Level 2 (visible on card): entry/stop/target, next event, last analysis date
- Level 3 (click to expand): full agent analysis, reasoning, calculations
- Level 4 (separate view): raw outputs, historical data, research notes

### Component Standards
- All cards: dark background, subtle border, hover effect
- All tables: no external borders, subtle row dividers, header in text-secondary
- All badges: rounded-full, small text, colour-coded
- Conviction display: 5 dots (filled = active conviction, empty = remaining)
- Timeline: vertical, left-aligned dots, colour-coded by category, expandable entries
- Charts: use Recharts library if needed, match colour palette

### Expandable Content Pattern
Default state: summary (1-3 lines)
Expanded state: full content with all details
Toggle: click on card/section header or chevron icon
Animation: none (instant toggle — no distracting transitions)

### Dashboard Question-Answer Mapping
| Question | Page | Primary Component |
|----------|------|-------------------|
| Which stocks need attention? | Overview | StockCard grid |
| What's the thesis? | StockDetail | DecisionCard |
| Why this conclusion? | StockDetail | AnalysisTrail (expandable) |
| What are the numbers? | StockDetail | DataPanel |
| What happened/coming? | CatalystTracker | CatalystTimeline + EventCalendar |
| How am I doing? | TradingJournal | Position table + P&L summary |

### Anti-Patterns
- Never use white/light backgrounds (this is a trading dashboard — dark mode only)
- Never use animations or loading spinners for local data (it's instant)
- Never show raw JSON to the user (always format into readable components)
- Never truncate critical decision info (verdict, stop, target always fully visible)
- Never use more than 3 font sizes on one card
- Never put a scrollbar inside a card (expand instead)
