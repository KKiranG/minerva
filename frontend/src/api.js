const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const mockNow = '2026-03-23T12:00:00Z';

const STOCK_BLUEPRINTS = [
  {
    ticker: 'MP',
    company_name: 'MP Materials',
    primary_mineral: 'Rare Earths',
    value_chain_stage: 'Integrated mine-to-magnet',
    country: 'United States',
    market_cap: 5720000000,
    enterprise_value: 6070000000,
    shares_outstanding: 169000000,
    current_price: 33.84,
    daily_change_amount: 1.12,
    daily_change_percent: 3.42,
    current_verdict: 'BULLISH',
    current_action: 'BUY',
    current_conviction: 4,
    current_thesis: 'Stage II magnetics execution plus domestic procurement support keeps the asymmetry constructive.',
    current_stop: 28.4,
    current_target: 42,
    entry_low: 30.2,
    entry_high: 32.8,
    timeframe: '3-9 months',
    open_position_flag: true,
    needs_attention: false,
    alert_flag: true,
    last_analysis_date: '2026-03-22T14:15:00Z',
    last_full_analysis: '2026-03-17T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 32.72,
      open: 33.1,
      low: 32.88,
      high: 34.06,
      support: 31.4,
      resistance: 34.5,
      breakout_level: 35.1,
      invalidation_level: 28.4,
      week_52_low: 15.92,
      week_52_high: 36.48,
      volume_multiple: 1.6,
      atr_percent: 4.9
    },
    analysis_trail: [
      {
        id: 'MP-1',
        title: 'Catalyst stack upgraded after DOE follow-through',
        stage: 'Delta review',
        created_at: '2026-03-22T14:15:00Z',
        owner: 'Frontier review',
        verdict: 'BULLISH',
        conviction: 4,
        summary: 'Funding cadence and downstream demand both improved enough to move the setup back into active-buy territory.',
        bullets: [
          'Volume confirmed the reclaim of the 50-day trend zone.',
          'Policy language stayed specific to domestic magnet capacity.',
          'Risk budget remains acceptable above the prior pivot.'
        ],
        risks: ['A delayed customer ramp would flatten the near-term earnings bridge.']
      },
      {
        id: 'MP-2',
        title: 'Position sizing kept moderate into funding headlines',
        stage: 'Risk review',
        created_at: '2026-03-19T13:10:00Z',
        owner: 'Risk desk',
        verdict: 'BULLISH',
        conviction: 3,
        summary: 'Sizing stayed under full weight until the funding milestone moved from rumor to documentation.',
        bullets: [
          'Stop remains below the January base.',
          'Upside still favors a starter plus add-on structure.'
        ],
        risks: ['The name can overshoot on policy headlines and mean-revert quickly.']
      }
    ],
    government_funding: [
      {
        id: 'MP-F1',
        agency: 'DOE',
        program: 'Domestic magnet supply chain grant',
        announced_date: '2026-03-18',
        amount_ceiling: 125000000,
        amount_obligated: 95000000,
        amount_disbursed: 28000000,
        status: 'ANNOUNCED',
        next_milestone: 'Detailed project update due Apr 2026',
        notes: 'Funding is tied to downstream magnet capacity milestones.'
      }
    ],
    catalysts: [
      {
        extraction_id: 201,
        analysis_run_id: 'RUN_2026-03-22_141500_MP',
        date: '2026-03-29',
        category: 'GOV_FUNDING',
        title: 'DOE magnetics grant detail release',
        description: 'Documentation should clarify milestone cadence and what portion is construction versus equipment.',
        amount_ceiling: 125000000,
        amount_obligated: 95000000,
        amount_disbursed: 28000000,
        binding_status: 'ANNOUNCED',
        verification_grade: 'A',
        significance: 5,
        priced_in: 'Partial',
        timeline_to_next_effect: '1-3 weeks',
        next_decision_point: 'Management commentary on deployment schedule',
        reversal_risk: 'If milestones slip, the policy premium compresses.',
        probability_materialising: 'HIGH',
        source: 'Desk',
        notes: 'Directly informs the add-on trigger above resistance.'
      },
      {
        extraction_id: 201,
        analysis_run_id: 'RUN_2026-03-22_141500_MP',
        date: '2026-04-12',
        category: 'OFFTAKE',
        title: 'Potential NdPr offtake update',
        description: 'Any incremental demand visibility would reinforce the downstream earnings bridge.',
        binding_status: 'RUMORED',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'No',
        timeline_to_next_effect: '2-6 weeks',
        next_decision_point: 'Customer agreement or management confirmation',
        reversal_risk: 'Silence past the event window weakens momentum.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Useful second-leg catalyst if the first move gets crowded.'
      }
    ],
    events: [
      {
        extraction_id: 201,
        date: '2026-03-29',
        event_type: 'GOVERNMENT_UPDATE',
        description: 'DOE project documentation and milestone timing',
        impact: 'HIGH',
        source: 'Desk',
        bull_case: 'Capital timing derisks the magnet buildout and supports forward multiple expansion.',
        bear_case: 'The award proves narrower or slower than the market expects.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'Domestic magnet build remains the core variant view',
        note_body: 'The market understands policy support, but it is still underestimating how quickly specific milestones can lift confidence in downstream economics.',
        note_type: 'THESIS',
        source: 'MINERVA',
        created_at: '2026-03-22T15:10:00Z'
      },
      {
        title: 'Watch the tape around 35',
        note_body: 'If price accepts above the recent resistance shelf on volume, the add trigger becomes cleaner than buying the headline spike.',
        note_type: 'PRICE_ACTION',
        source: 'Desk',
        created_at: '2026-03-22T18:05:00Z'
      }
    ],
    journal: [
      {
        run_id: 'RUN_2026-03-22_141500_MP',
        status: 'OPEN',
        direction: 'LONG',
        entry_date: '2026-03-19',
        exit_date: null,
        entry_price: 31.12,
        exit_price: null,
        stop_loss: 28.4,
        target_price: 42,
        quantity: 4200,
        capital_committed: 130704,
        pnl_amount: 11424,
        pnl_percent: 8.74,
        thesis: 'Domestic magnet supply chain leverage with explicit policy support.',
        outcome: 'Starter position is working; add only on confirmation.',
        pattern_tags: ['policy', 'breakout'],
        notes: 'Keep size below full until funding language is fully documented.',
        created_at: '2026-03-22T16:05:00Z'
      }
    ]
  },
  {
    ticker: 'UUUU',
    company_name: 'Energy Fuels',
    primary_mineral: 'Uranium / Rare Earths',
    value_chain_stage: 'Processing',
    country: 'United States',
    market_cap: 1430000000,
    enterprise_value: 1360000000,
    shares_outstanding: 207000000,
    current_price: 6.18,
    daily_change_amount: -0.14,
    daily_change_percent: -2.22,
    current_verdict: 'BULLISH',
    current_action: 'BUY',
    current_conviction: 4,
    current_thesis: 'White Mesa optionality plus policy relevance still outweighs the execution noise, but the story remains headline-sensitive.',
    current_stop: 5.18,
    current_target: 8.15,
    entry_low: 5.85,
    entry_high: 6.25,
    timeframe: '2-6 months',
    open_position_flag: true,
    needs_attention: true,
    alert_flag: true,
    last_analysis_date: '2026-03-21T13:35:00Z',
    last_full_analysis: '2026-03-16T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 6.32,
      open: 6.28,
      low: 6.06,
      high: 6.33,
      support: 5.9,
      resistance: 6.45,
      breakout_level: 6.62,
      invalidation_level: 5.18,
      week_52_low: 4.11,
      week_52_high: 7.08,
      volume_multiple: 1.3,
      atr_percent: 5.6
    },
    analysis_trail: [
      {
        id: 'UUUU-1',
        title: 'Execution noise increased, thesis stayed intact',
        stage: 'Delta review',
        created_at: '2026-03-21T13:35:00Z',
        owner: 'Frontier review',
        verdict: 'BULLISH',
        conviction: 4,
        summary: 'The desk kept the buy rating because processing progress still matters more than one choppy tape session.',
        bullets: [
          'Price pulled back into prior support instead of breaking trend.',
          'The policy angle remains unique versus most domestic peers.',
          'Sizing stays controlled until the next operations update.'
        ],
        risks: ['A vague update could break confidence faster than fundamentals warrant.']
      },
      {
        id: 'UUUU-2',
        title: 'Permitting milestone remains the key catalyst',
        stage: 'Catalyst review',
        created_at: '2026-03-18T11:20:00Z',
        owner: 'Catalyst & policy',
        verdict: 'BULLISH',
        conviction: 3,
        summary: 'We upgraded significance after the market started to price a cleaner ramp path.',
        bullets: ['Keep the position small until the milestone arrives.'],
        risks: ['Execution timing can slip without warning.']
      }
    ],
    government_funding: [
      {
        id: 'UUUU-F1',
        agency: 'DoD',
        program: 'Critical minerals processing support',
        announced_date: '2026-03-12',
        amount_ceiling: 48000000,
        amount_obligated: 22000000,
        amount_disbursed: 7000000,
        status: 'CONDITIONAL',
        next_milestone: 'Operational readiness update in early April',
        notes: 'Disbursement steps depend on processing throughput milestones.'
      }
    ],
    catalysts: [
      {
        extraction_id: 202,
        analysis_run_id: 'RUN_2026-03-21_133500_UUUU',
        date: '2026-04-02',
        category: 'PROJECT_UPDATE',
        title: 'White Mesa throughput update',
        description: 'The next update should frame whether the separation ramp is matching the desk model.',
        binding_status: 'SCHEDULED',
        verification_grade: 'A',
        significance: 5,
        priced_in: 'Somewhat',
        timeline_to_next_effect: '1-2 weeks',
        next_decision_point: 'Throughput figures and commentary',
        reversal_risk: 'A fuzzy update would likely break the recent base.',
        probability_materialising: 'HIGH',
        source: 'Desk',
        notes: 'Most important near-term line item.'
      },
      {
        extraction_id: 202,
        analysis_run_id: 'RUN_2026-03-21_133500_UUUU',
        date: '2026-04-15',
        category: 'GOV_FUNDING',
        title: 'Processing support agreement amendment watch',
        description: 'Expanded support would extend the confidence window for capex and timing.',
        amount_ceiling: 48000000,
        amount_obligated: 22000000,
        amount_disbursed: 7000000,
        binding_status: 'CONDITIONAL',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'No',
        timeline_to_next_effect: '3-5 weeks',
        next_decision_point: 'Agency filing or company confirmation',
        reversal_risk: 'No amendment leaves the market focused on self-funded execution.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Important but secondary to throughput.'
      }
    ],
    events: [
      {
        extraction_id: 202,
        date: '2026-04-02',
        event_type: 'OPERATIONS_UPDATE',
        description: 'White Mesa throughput and separation update',
        impact: 'HIGH',
        source: 'Desk',
        bull_case: 'Progress validates the processing rerate and supports another leg higher.',
        bear_case: 'A slow or qualified update reopens the execution discount.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'The setup still depends on real processing evidence',
        note_body: 'Macro policy support helps, but the tape is telling us investors still need operational proof before they rerate the name sustainably.',
        note_type: 'THESIS',
        source: 'MINERVA',
        created_at: '2026-03-21T14:00:00Z'
      }
    ],
    journal: [
      {
        run_id: 'RUN_2026-03-21_133500_UUUU',
        status: 'OPEN',
        direction: 'LONG',
        entry_date: '2026-03-20',
        exit_date: null,
        entry_price: 5.88,
        exit_price: null,
        stop_loss: 5.18,
        target_price: 8.15,
        quantity: 9000,
        capital_committed: 52920,
        pnl_amount: 2700,
        pnl_percent: 5.1,
        thesis: 'Operational improvement plus policy relevance.',
        outcome: 'Still in play; no add until the update lands.',
        pattern_tags: ['catalyst', 'execution'],
        notes: 'Treat this as event-driven, not a passive hold.',
        created_at: '2026-03-21T16:20:00Z'
      }
    ]
  },
  {
    ticker: 'USAR',
    company_name: 'USA Rare Earth',
    primary_mineral: 'Rare Earths',
    value_chain_stage: 'Magnet manufacturing',
    country: 'United States',
    market_cap: 1120000000,
    enterprise_value: 1190000000,
    shares_outstanding: 98000000,
    current_price: 11.46,
    daily_change_amount: 0.36,
    daily_change_percent: 3.24,
    current_verdict: 'NEUTRAL',
    current_action: 'WATCH',
    current_conviction: 3,
    current_thesis: 'The manufacturing angle is differentiated, but the desk still wants cleaner commercial proof before pressing size.',
    current_stop: 9.65,
    current_target: 14.2,
    entry_low: 10.4,
    entry_high: 11.1,
    timeframe: '1-2 quarters',
    open_position_flag: false,
    needs_attention: true,
    alert_flag: false,
    last_analysis_date: '2026-03-20T12:25:00Z',
    last_full_analysis: '2026-03-12T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 11.1,
      open: 11.18,
      low: 10.98,
      high: 11.58,
      support: 10.5,
      resistance: 11.75,
      breakout_level: 12.1,
      invalidation_level: 9.65,
      week_52_low: 7.38,
      week_52_high: 12.42,
      volume_multiple: 1.2,
      atr_percent: 6.1
    },
    analysis_trail: [
      {
        id: 'USAR-1',
        title: 'Stayed on watch despite improving tone',
        stage: 'Delta review',
        created_at: '2026-03-20T12:25:00Z',
        owner: 'Frontier review',
        verdict: 'NEUTRAL',
        conviction: 3,
        summary: 'The chart improved, but the team wants a commercial agreement before upgrading from watch to buy.',
        bullets: [
          'Manufacturing narrative is increasingly differentiated.',
          'The tape is responding to policy headlines, but contracts still matter most.'
        ],
        risks: ['Headline-driven squeezes can tempt entries before the evidence is there.']
      }
    ],
    government_funding: [
      {
        id: 'USAR-F1',
        agency: 'Export-Import Bank',
        program: 'Supply chain development memorandum',
        announced_date: '2026-03-05',
        amount_ceiling: 20000000,
        amount_obligated: 8000000,
        amount_disbursed: 0,
        status: 'PROPOSED',
        next_milestone: 'Commercial agreement support package update',
        notes: 'Still contingent on downstream contract formation.'
      }
    ],
    catalysts: [
      {
        extraction_id: 203,
        analysis_run_id: 'RUN_2026-03-20_122500_USAR',
        date: '2026-04-08',
        category: 'CONTRACT',
        title: 'Magnet customer announcement window',
        description: 'A real customer contract would be the fastest path to a higher-conviction stance.',
        binding_status: 'TARGETED',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'No',
        timeline_to_next_effect: '2-4 weeks',
        next_decision_point: 'Contract disclosure',
        reversal_risk: 'No announcement keeps the thesis theoretical.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'This is the main condition for an upgrade.'
      }
    ],
    events: [
      {
        extraction_id: 203,
        date: '2026-04-08',
        event_type: 'COMMERCIAL_UPDATE',
        description: 'Customer and financing milestone window',
        impact: 'HIGH',
        source: 'Desk',
        bull_case: 'A named customer would materially improve visibility and valuation support.',
        bear_case: 'Delay reinforces the market view that the story is still one step too early.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'Commercial proof is still the unlock',
        note_body: 'The market is willing to sponsor the narrative, but we should not confuse a better story with a closed commercial loop.',
        note_type: 'THESIS',
        source: 'Desk',
        created_at: '2026-03-20T13:10:00Z'
      }
    ],
    journal: []
  },
  {
    ticker: 'UAMY',
    company_name: 'United States Antimony',
    primary_mineral: 'Antimony',
    value_chain_stage: 'Refining',
    country: 'United States',
    market_cap: 292000000,
    enterprise_value: 279000000,
    shares_outstanding: 122000000,
    current_price: 2.39,
    daily_change_amount: 0.09,
    daily_change_percent: 3.91,
    current_verdict: 'BULLISH',
    current_action: 'WATCH',
    current_conviction: 3,
    current_thesis: 'Tight antimony supply keeps the setup interesting, but the desk wants a better operational read before upgrading to a full buy.',
    current_stop: 1.96,
    current_target: 3.15,
    entry_low: 2.12,
    entry_high: 2.28,
    timeframe: '1-3 months',
    open_position_flag: false,
    needs_attention: false,
    alert_flag: false,
    last_analysis_date: '2026-03-22T09:45:00Z',
    last_full_analysis: '2026-03-11T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 2.3,
      open: 2.31,
      low: 2.27,
      high: 2.42,
      support: 2.15,
      resistance: 2.46,
      breakout_level: 2.52,
      invalidation_level: 1.96,
      week_52_low: 0.84,
      week_52_high: 2.66,
      volume_multiple: 1.8,
      atr_percent: 7.2
    },
    analysis_trail: [
      {
        id: 'UAMY-1',
        title: 'Strong commodity tape moved the name back onto active watch',
        stage: 'Price action review',
        created_at: '2026-03-22T09:45:00Z',
        owner: 'Price action',
        verdict: 'BULLISH',
        conviction: 3,
        summary: 'The desk likes the breakout setup but still wants better visibility on operating consistency.',
        bullets: [
          'Relative volume improved materially.',
          'Supply headlines are starting to matter again.'
        ],
        risks: ['This name can gap on small-volume headlines.']
      }
    ],
    government_funding: [],
    catalysts: [
      {
        extraction_id: 204,
        analysis_run_id: 'RUN_2026-03-22_094500_UAMY',
        date: '2026-04-10',
        category: 'OPERATIONS',
        title: 'Refinery throughput commentary',
        description: 'Management color on throughput and margins will determine whether the breakout can hold.',
        binding_status: 'SCHEDULED',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'Partial',
        timeline_to_next_effect: '2-3 weeks',
        next_decision_point: 'Management update',
        reversal_risk: 'A soft update invites a quick retrace back into the base.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Good event for deciding whether to shift from watch to buy.'
      }
    ],
    events: [
      {
        extraction_id: 204,
        date: '2026-04-10',
        event_type: 'OPERATIONS_UPDATE',
        description: 'Refinery throughput and margin commentary',
        impact: 'MEDIUM',
        source: 'Desk',
        bull_case: 'A strong update validates the breakout and supports a cleaner rerating.',
        bear_case: 'Weak throughput data exposes the move as mostly commodity-driven.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'Antimony tightness is real, but execution still matters',
        note_body: 'We should not let the commodity narrative outrun the company-specific evidence set.',
        note_type: 'RISK',
        source: 'MINERVA',
        created_at: '2026-03-22T10:10:00Z'
      }
    ],
    journal: []
  },
  {
    ticker: 'PPTA',
    company_name: 'Perpetua Resources',
    primary_mineral: 'Antimony / Gold',
    value_chain_stage: 'Development',
    country: 'United States',
    market_cap: 904000000,
    enterprise_value: 1010000000,
    shares_outstanding: 71000000,
    current_price: 12.74,
    daily_change_amount: 0.24,
    daily_change_percent: 1.92,
    current_verdict: 'BULLISH',
    current_action: 'BUY',
    current_conviction: 4,
    current_thesis: 'Strategic antimony exposure plus project financing progress still make this one of the cleaner policy-linked setups.',
    current_stop: 10.65,
    current_target: 16.5,
    entry_low: 11.9,
    entry_high: 12.5,
    timeframe: '3-12 months',
    open_position_flag: true,
    needs_attention: true,
    alert_flag: true,
    last_analysis_date: '2026-03-22T11:55:00Z',
    last_full_analysis: '2026-03-14T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 12.5,
      open: 12.58,
      low: 12.44,
      high: 12.92,
      support: 11.88,
      resistance: 13.1,
      breakout_level: 13.35,
      invalidation_level: 10.65,
      week_52_low: 6.74,
      week_52_high: 13.42,
      volume_multiple: 1.45,
      atr_percent: 5.2
    },
    analysis_trail: [
      {
        id: 'PPTA-1',
        title: 'Financing path tightened enough for an active long',
        stage: 'Delta review',
        created_at: '2026-03-22T11:55:00Z',
        owner: 'Frontier review',
        verdict: 'BULLISH',
        conviction: 4,
        summary: 'The policy backdrop and the financing path are aligning well enough to keep PPTA among the highest-conviction policy names.',
        bullets: [
          'The chart is constructive rather than euphoric.',
          'Strategic antimony exposure continues to attract incremental interest.'
        ],
        risks: ['Project sequencing or financing surprises would hit the name hard.']
      }
    ],
    government_funding: [
      {
        id: 'PPTA-F1',
        agency: 'EXIM',
        program: 'Project financing support indication',
        announced_date: '2026-03-07',
        amount_ceiling: 1800000000,
        amount_obligated: 0,
        amount_disbursed: 0,
        status: 'INDICATED',
        next_milestone: 'Formal financing structure update expected in April',
        notes: 'Large-scale support is still progressing through diligence.'
      }
    ],
    catalysts: [
      {
        extraction_id: 205,
        analysis_run_id: 'RUN_2026-03-22_115500_PPTA',
        date: '2026-04-11',
        category: 'FINANCING',
        title: 'Project financing package update',
        description: 'The market is waiting for cleaner financing visibility to extend the rerating.',
        binding_status: 'IN_PROGRESS',
        verification_grade: 'A',
        significance: 5,
        priced_in: 'Somewhat',
        timeline_to_next_effect: '2-4 weeks',
        next_decision_point: 'Formal financing update',
        reversal_risk: 'Any financing delay pushes the setup back into range trade mode.',
        probability_materialising: 'HIGH',
        source: 'Desk',
        notes: 'Primary near-term driver.'
      },
      {
        extraction_id: 205,
        analysis_run_id: 'RUN_2026-03-22_115500_PPTA',
        date: '2026-04-24',
        category: 'GOV_FUNDING',
        title: 'Strategic support package clarity',
        description: 'Follow-through would strengthen the strategic-minerals narrative materially.',
        amount_ceiling: 1800000000,
        amount_obligated: 0,
        amount_disbursed: 0,
        binding_status: 'INDICATED',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'Partial',
        timeline_to_next_effect: '4-6 weeks',
        next_decision_point: 'Agency commentary or term-sheet progress',
        reversal_risk: 'Silence keeps valuation tied to gold rather than strategy.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Secondary but meaningful.'
      }
    ],
    events: [
      {
        extraction_id: 205,
        date: '2026-04-11',
        event_type: 'FINANCING_UPDATE',
        description: 'Project financing and support package update',
        impact: 'HIGH',
        source: 'Desk',
        bull_case: 'Clearer capital structure supports a move through recent highs.',
        bear_case: 'Ambiguous timing sends the stock back into consolidation.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'PPTA remains the cleanest antimony-policy vehicle',
        note_body: 'Financing is still the gating item, but the strategic narrative is sufficiently real to justify an active long bias.',
        note_type: 'THESIS',
        source: 'MINERVA',
        created_at: '2026-03-22T12:20:00Z'
      }
    ],
    journal: [
      {
        run_id: 'RUN_2026-03-22_115500_PPTA',
        status: 'OPEN',
        direction: 'LONG',
        entry_date: '2026-03-18',
        exit_date: null,
        entry_price: 11.92,
        exit_price: null,
        stop_loss: 10.65,
        target_price: 16.5,
        quantity: 3100,
        capital_committed: 36952,
        pnl_amount: 2542,
        pnl_percent: 6.88,
        thesis: 'Financing progress plus strategic antimony support.',
        outcome: 'Stay patient through the next financing checkpoint.',
        pattern_tags: ['policy', 'financing'],
        notes: 'Do not add above resistance without the financing update.',
        created_at: '2026-03-22T13:05:00Z'
      }
    ]
  },
  {
    ticker: 'NB',
    company_name: 'NioCorp Developments',
    primary_mineral: 'Niobium / Scandium',
    value_chain_stage: 'Development',
    country: 'United States',
    market_cap: 176000000,
    enterprise_value: 214000000,
    shares_outstanding: 49000000,
    current_price: 3.61,
    daily_change_amount: -0.08,
    daily_change_percent: -2.17,
    current_verdict: 'NEUTRAL',
    current_action: 'WATCH',
    current_conviction: 2,
    current_thesis: 'The strategic mineral mix is attractive, but financing and execution still dominate the setup.',
    current_stop: 3.02,
    current_target: 4.65,
    entry_low: 3.28,
    entry_high: 3.46,
    timeframe: '1-2 quarters',
    open_position_flag: false,
    needs_attention: true,
    alert_flag: false,
    last_analysis_date: '2026-03-19T10:50:00Z',
    last_full_analysis: '2026-03-09T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 3.69,
      open: 3.66,
      low: 3.56,
      high: 3.72,
      support: 3.32,
      resistance: 3.78,
      breakout_level: 3.9,
      invalidation_level: 3.02,
      week_52_low: 2.42,
      week_52_high: 4.18,
      volume_multiple: 0.96,
      atr_percent: 5.8
    },
    analysis_trail: [
      {
        id: 'NB-1',
        title: 'Still too early for a conviction upgrade',
        stage: 'Full review follow-up',
        created_at: '2026-03-19T10:50:00Z',
        owner: 'Frontier review',
        verdict: 'NEUTRAL',
        conviction: 2,
        summary: 'The desk likes the mineral mix, but capital structure and timeline uncertainty still block a long.',
        bullets: [
          'Optionality remains attractive on paper.',
          'The chart is not giving a compelling entry yet.'
        ],
        risks: ['Any financing surprise will dominate the equity response.']
      }
    ],
    government_funding: [],
    catalysts: [
      {
        extraction_id: 206,
        analysis_run_id: 'RUN_2026-03-19_105000_NB',
        date: '2026-04-17',
        category: 'PERMITTING',
        title: 'Permitting and financing status checkpoint',
        description: 'The next milestone needs to tighten timing rather than just repeat strategic relevance.',
        binding_status: 'PENDING',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'No',
        timeline_to_next_effect: '3-4 weeks',
        next_decision_point: 'Management update or filing',
        reversal_risk: 'Another vague update leaves the stock in penalty-box territory.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Critical for determining whether the watch stays active.'
      }
    ],
    events: [
      {
        extraction_id: 206,
        date: '2026-04-17',
        event_type: 'PROJECT_UPDATE',
        description: 'Permitting and financing status checkpoint',
        impact: 'MEDIUM',
        source: 'Desk',
        bull_case: 'A tighter timeline would make the optionality more actionable.',
        bear_case: 'No timing improvement keeps the desk sidelined.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'Optionality is real, timing is not',
        note_body: 'NB is one of the more interesting strategic-mineral stories conceptually, but the capital stack still overwhelms the thesis.',
        note_type: 'RISK',
        source: 'Desk',
        created_at: '2026-03-19T11:15:00Z'
      }
    ],
    journal: []
  },
  {
    ticker: 'METC',
    company_name: 'Ramaco Resources',
    primary_mineral: 'Metallurgical Coal / Rare Earths',
    value_chain_stage: 'Production',
    country: 'United States',
    market_cap: 647000000,
    enterprise_value: 812000000,
    shares_outstanding: 54000000,
    current_price: 11.94,
    daily_change_amount: 0.12,
    daily_change_percent: 1.02,
    current_verdict: 'BULLISH',
    current_action: 'HOLD',
    current_conviction: 3,
    current_thesis: 'Cash flow from the core business gives METC a different risk profile, while the rare-earth angle remains a free option.',
    current_stop: 10.42,
    current_target: 14.1,
    entry_low: 10.9,
    entry_high: 11.4,
    timeframe: '1-2 quarters',
    open_position_flag: true,
    needs_attention: false,
    alert_flag: false,
    last_analysis_date: '2026-03-18T14:05:00Z',
    last_full_analysis: '2026-03-08T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 11.82,
      open: 11.79,
      low: 11.7,
      high: 12.06,
      support: 11.28,
      resistance: 12.18,
      breakout_level: 12.32,
      invalidation_level: 10.42,
      week_52_low: 8.84,
      week_52_high: 13.26,
      volume_multiple: 0.88,
      atr_percent: 4.3
    },
    analysis_trail: [
      {
        id: 'METC-1',
        title: 'Hold rating maintained on balanced risk profile',
        stage: 'Portfolio review',
        created_at: '2026-03-18T14:05:00Z',
        owner: 'Portfolio desk',
        verdict: 'BULLISH',
        conviction: 3,
        summary: 'The rare-earth narrative is not the only reason to own it, which lowers downside stress versus smaller peers.',
        bullets: [
          'Core cash flow supports patience.',
          'Optionality still matters if the mineral narrative keeps gaining attention.'
        ],
        risks: ['The market can ignore the optionality for long stretches.']
      }
    ],
    government_funding: [],
    catalysts: [
      {
        extraction_id: 207,
        analysis_run_id: 'RUN_2026-03-18_140500_METC',
        date: '2026-04-05',
        category: 'RESOURCE_UPDATE',
        title: 'Rare-earth development update',
        description: 'The next commentary window should clarify how much value the market should assign to the optionality.',
        binding_status: 'SCHEDULED',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'Partial',
        timeline_to_next_effect: '1-3 weeks',
        next_decision_point: 'Development update',
        reversal_risk: 'A thin update sends investors back to focusing only on coal.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Useful for deciding whether to move from hold to active buy.'
      }
    ],
    events: [
      {
        extraction_id: 207,
        date: '2026-04-05',
        event_type: 'DEVELOPMENT_UPDATE',
        description: 'Rare-earth optionality progress update',
        impact: 'MEDIUM',
        source: 'Desk',
        bull_case: 'Specific progress raises the value investors assign to the optionality.',
        bear_case: 'A generic update leaves the stock trading only on its core business.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'METC is a different kind of mineral bet',
        note_body: 'The balance-sheet and cash-flow profile matters. This is not a pure exploration optionality trade, which is exactly why it can stay in the book.',
        note_type: 'PORTFOLIO',
        source: 'MINERVA',
        created_at: '2026-03-18T15:00:00Z'
      }
    ],
    journal: [
      {
        run_id: 'RUN_2026-03-18_140500_METC',
        status: 'OPEN',
        direction: 'LONG',
        entry_date: '2026-03-11',
        exit_date: null,
        entry_price: 11.08,
        exit_price: null,
        stop_loss: 10.42,
        target_price: 14.1,
        quantity: 2600,
        capital_committed: 28808,
        pnl_amount: 2236,
        pnl_percent: 7.76,
        thesis: 'Defensive optionality with real cash flow.',
        outcome: 'Comfortable hold while waiting for the next development update.',
        pattern_tags: ['optionality', 'cashflow'],
        notes: 'Would add only if the rare-earth angle becomes more concrete.',
        created_at: '2026-03-18T16:10:00Z'
      }
    ]
  },
  {
    ticker: 'ALM',
    company_name: 'Almonty Industries',
    primary_mineral: 'Tungsten',
    value_chain_stage: 'Production ramp',
    country: 'South Korea',
    market_cap: 986000000,
    enterprise_value: 1100000000,
    shares_outstanding: 258000000,
    current_price: 3.82,
    daily_change_amount: 0.06,
    daily_change_percent: 1.6,
    current_verdict: 'BULLISH',
    current_action: 'BUY',
    current_conviction: 4,
    current_thesis: 'Sangdong ramp timing plus strategic tungsten scarcity make ALM one of the cleaner non-REE strategic materials trades.',
    current_stop: 3.21,
    current_target: 4.95,
    entry_low: 3.48,
    entry_high: 3.7,
    timeframe: '2-9 months',
    open_position_flag: false,
    needs_attention: false,
    alert_flag: false,
    last_analysis_date: '2026-03-22T08:40:00Z',
    last_full_analysis: '2026-03-13T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 3.76,
      open: 3.77,
      low: 3.73,
      high: 3.86,
      support: 3.52,
      resistance: 3.9,
      breakout_level: 4.02,
      invalidation_level: 3.21,
      week_52_low: 1.98,
      week_52_high: 4.11,
      volume_multiple: 1.18,
      atr_percent: 4.7
    },
    analysis_trail: [
      {
        id: 'ALM-1',
        title: 'Ramp setup stayed among top-ranked international names',
        stage: 'Delta review',
        created_at: '2026-03-22T08:40:00Z',
        owner: 'Frontier review',
        verdict: 'BULLISH',
        conviction: 4,
        summary: 'Execution still matters, but the strategic tungsten angle remains unusually clean and investable.',
        bullets: [
          'Chart held the prior breakout region.',
          'Macro scarcity narrative is still gaining investor mindshare.'
        ],
        risks: ['Ramp slippage is the only issue that really matters right now.']
      }
    ],
    government_funding: [
      {
        id: 'ALM-F1',
        agency: 'Korea Eximbank',
        program: 'Strategic tungsten project support',
        announced_date: '2026-02-27',
        amount_ceiling: 76000000,
        amount_obligated: 52000000,
        amount_disbursed: 19000000,
        status: 'ACTIVE',
        next_milestone: 'Ramp readiness update due in April',
        notes: 'Supports equipment and working capital through initial ramp.'
      }
    ],
    catalysts: [
      {
        extraction_id: 208,
        analysis_run_id: 'RUN_2026-03-22_084000_ALM',
        date: '2026-04-06',
        category: 'RAMP',
        title: 'Sangdong ramp readiness update',
        description: 'A cleaner ramp timeline would support another leg higher.',
        binding_status: 'SCHEDULED',
        verification_grade: 'A',
        significance: 5,
        priced_in: 'Partial',
        timeline_to_next_effect: '1-3 weeks',
        next_decision_point: 'Ramp readiness commentary',
        reversal_risk: 'A delay would hit one of the cleanest strategic-materials charts on the board.',
        probability_materialising: 'HIGH',
        source: 'Desk',
        notes: 'High-conviction near-term event.'
      }
    ],
    events: [
      {
        extraction_id: 208,
        date: '2026-04-06',
        event_type: 'RAMP_UPDATE',
        description: 'Sangdong ramp readiness update',
        impact: 'HIGH',
        source: 'Desk',
        bull_case: 'A firm readiness timeline confirms the path to production and supports a premium multiple.',
        bear_case: 'Even a modest delay could unwind a portion of the rerating quickly.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'ALM is one of the better-structured strategic narratives',
        note_body: 'This is a real asset with a genuine scarcity narrative and visible ramp milestones, which is why it keeps ranking well on the board.',
        note_type: 'THESIS',
        source: 'Desk',
        created_at: '2026-03-22T09:05:00Z'
      }
    ],
    journal: []
  },
  {
    ticker: 'AXTI',
    company_name: 'AXT, Inc.',
    primary_mineral: 'Gallium / Indium / Substrates',
    value_chain_stage: 'Materials processing',
    country: 'United States',
    market_cap: 221000000,
    enterprise_value: 168000000,
    shares_outstanding: 45400000,
    current_price: 4.87,
    daily_change_amount: -0.06,
    daily_change_percent: -1.22,
    current_verdict: 'NEUTRAL',
    current_action: 'WATCH',
    current_conviction: 3,
    current_thesis: 'The export-control angle creates upside bursts, but the desk still sees a headline-driven tape rather than a stable rerating.',
    current_stop: 4.14,
    current_target: 6.05,
    entry_low: 4.42,
    entry_high: 4.7,
    timeframe: '1-3 months',
    open_position_flag: false,
    needs_attention: true,
    alert_flag: true,
    last_analysis_date: '2026-03-21T15:20:00Z',
    last_full_analysis: '2026-03-10T16:00:00Z',
    latest_price_snapshot: {
      snapshot_at: '2026-03-22T20:00:00Z',
      previous_close: 4.93,
      open: 4.95,
      low: 4.82,
      high: 5.01,
      support: 4.48,
      resistance: 5.06,
      breakout_level: 5.18,
      invalidation_level: 4.14,
      week_52_low: 2.76,
      week_52_high: 5.34,
      volume_multiple: 1.04,
      atr_percent: 5.1
    },
    analysis_trail: [
      {
        id: 'AXTI-1',
        title: 'Headline sensitivity triggered an alert',
        stage: 'Tape review',
        created_at: '2026-03-21T15:20:00Z',
        owner: 'Price action',
        verdict: 'NEUTRAL',
        conviction: 3,
        summary: 'The desk kept AXTI on watch because the export-control narrative is real, but position quality depends on avoiding crowded spikes.',
        bullets: [
          'Price is still below the clean breakout level.',
          'Macro sensitivity is high relative to operating visibility.'
        ],
        risks: ['The tape can reverse instantly when policy headlines cool.']
      }
    ],
    government_funding: [],
    catalysts: [
      {
        extraction_id: 209,
        analysis_run_id: 'RUN_2026-03-21_152000_AXTI',
        date: '2026-03-31',
        category: 'POLICY',
        title: 'Gallium and substrate demand follow-up',
        description: 'A clearer demand and pricing read would determine whether the latest move has legs.',
        binding_status: 'PENDING',
        verification_grade: 'B',
        significance: 4,
        priced_in: 'Somewhat',
        timeline_to_next_effect: '1-2 weeks',
        next_decision_point: 'Policy or customer commentary',
        reversal_risk: 'If the policy narrative cools, the move likely fades quickly.',
        probability_materialising: 'MEDIUM',
        source: 'Desk',
        notes: 'Alert remains on until the setup resolves.'
      }
    ],
    events: [
      {
        extraction_id: 209,
        date: '2026-03-31',
        event_type: 'POLICY_UPDATE',
        description: 'Gallium and customer demand follow-up',
        impact: 'MEDIUM',
        source: 'Desk',
        bull_case: 'Demand commentary supports the idea that recent price strength is fundamental, not purely narrative.',
        bear_case: 'A softer read leaves the move looking like another policy-driven fade candidate.',
        status: 'UPCOMING'
      }
    ],
    research: [
      {
        title: 'AXTI needs a cleaner fundamental bridge',
        note_body: 'The policy linkage is attractive, but we still need to see that it is feeding through to durable customer and margin expectations.',
        note_type: 'RISK',
        source: 'MINERVA',
        created_at: '2026-03-21T16:05:00Z'
      }
    ],
    journal: []
  }
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export const seedUniverse = STOCK_BLUEPRINTS.map(({ ticker, company_name }) => ({ ticker, company_name }));

const MOCK_STOCKS = STOCK_BLUEPRINTS.map(({ catalysts, events, research, journal, government_funding, ...stock }) => ({
  ...stock,
  government_funding,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: stock.last_analysis_date
}));

const MOCK_CATALYSTS = STOCK_BLUEPRINTS.flatMap((stock, stockIndex) =>
  stock.catalysts.map((item, itemIndex) => ({
    id: stockIndex * 100 + itemIndex + 1,
    ticker: stock.ticker,
    affected_tickers: [stock.ticker],
    created_at: stock.last_analysis_date,
    updated_at: stock.last_analysis_date,
    ...item
  }))
);

const MOCK_EVENTS = STOCK_BLUEPRINTS.flatMap((stock, stockIndex) =>
  stock.events.map((item, itemIndex) => ({
    id: stockIndex * 100 + itemIndex + 1,
    ticker: stock.ticker,
    created_at: stock.last_analysis_date,
    ...item
  }))
);

const MOCK_RESEARCH = STOCK_BLUEPRINTS.flatMap((stock, stockIndex) =>
  stock.research.map((item, itemIndex) => ({
    id: stockIndex * 100 + itemIndex + 1,
    ticker: stock.ticker,
    extraction_id: 200 + stockIndex + 1,
    ...item
  }))
);

const MOCK_JOURNAL = STOCK_BLUEPRINTS.flatMap((stock, stockIndex) =>
  stock.journal.map((item, itemIndex) => ({
    id: stockIndex * 100 + itemIndex + 1,
    ticker: stock.ticker,
    ...item
  }))
);

const MOCK_ANALYSIS = {
  execution: {
    specialists: [
      { agent: 'Catalyst & Policy', parse_status: 'COMPLETE' },
      { agent: 'Price Action & Market Structure', parse_status: 'COMPLETE' },
      { agent: 'Risk & Position Sizing', parse_status: 'COMPLETE' },
      { agent: 'Fundamentals & Capital Structure', parse_status: 'COMPLETE' },
      { agent: 'Options & Positioning', parse_status: 'COMPLETE' },
      { agent: 'Macro & Commodity Context', parse_status: 'COMPLETE' },
      { agent: 'Management & Execution', parse_status: 'COMPLETE' },
      { agent: 'Relative Value & Peer Context', parse_status: 'COMPLETE' },
      { agent: 'Scenario Stress Test', parse_status: 'COMPLETE' }
    ],
    review: {
      consistency: '## CONSISTENCY_CHECK\nALL CHECKS PASSED',
      synthesis: 'The current review universe still favors event-driven setups with visible policy or financing catalysts and defined downside.'
    }
  },
  frontier: {
    final_verdict: 'BULLISH',
    final_action: 'BUY',
    final_conviction: 4,
    one_line_summary: 'The catalyst stack supports a constructive stance with defined downside.',
    entry_low: 30.2,
    entry_high: 32.8,
    stop_loss: 28.4,
    target_price: 42,
    timeframe: '3-9 months',
    agreements: ['Catalyst timing is visible.', 'Risk/reward stays attractive above support.'],
    blind_spots: ['Headline sensitivity can distort entries.']
  }
};

const shouldFallback = (error) =>
  error instanceof TypeError ||
  error?.name === 'TypeError' ||
  String(error?.message || '').includes('Failed to fetch') ||
  String(error?.message || '').includes('NetworkError');

const buildUrl = (path) => `${API_BASE}${path}`;

const buildQuery = (path, params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};

class ApiError extends Error {
  constructor(message, { status, body, path }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

const request = async (path, { method = 'GET', body, signal, headers } = {}) => {
  const response = await fetch(buildUrl(path), {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, {
      status: response.status,
      body: payload,
      path
    });
  }
  return payload;
};

const requestWithFallback = async (path, options, fallback) => {
  try {
    return await request(path, options);
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    await delay(150);
    return clone(typeof fallback === 'function' ? fallback() : fallback);
  }
};

const requestFirstAvailable = async (paths, options) => {
  let lastError = null;
  for (const path of paths) {
    try {
      const payload = await request(path, options);
      return { payload, path };
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && [404, 405, 501].includes(error.status)) continue;
      throw error;
    }
  }
  throw lastError;
};

const tickerList = () => seedUniverse;

const getMockStock = (ticker) => MOCK_STOCKS.find((stock) => stock.ticker === String(ticker || '').toUpperCase()) || null;

const getMockLatestPrice = (ticker) => {
  const stock = getMockStock(ticker);
  if (!stock?.latest_price_snapshot) return null;
  const snapshot = stock.latest_price_snapshot;
  return {
    ticker: stock.ticker,
    date: String(snapshot.snapshot_at || mockNow).slice(0, 10),
    close: stock.current_price,
    open: snapshot.open ?? null,
    high: snapshot.high ?? null,
    low: snapshot.low ?? null,
    change_pct: stock.daily_change_percent ?? null,
    relative_volume: snapshot.volume_multiple ?? null,
    support1: snapshot.support ?? null,
    support2: snapshot.invalidation_level ?? null,
    resistance1: snapshot.resistance ?? null,
    resistance2: snapshot.breakout_level ?? null,
    ma50: null,
    ma200: null,
    atr14: snapshot.atr_percent ?? null,
    new_high_52w: stock.current_price >= snapshot.week_52_high,
    new_low_52w: stock.current_price <= snapshot.week_52_low,
    key_level: snapshot.breakout_level ? `Breakout ${snapshot.breakout_level}` : null,
    notes: null
  };
};

const filterByTicker = (rows, ticker) => {
  if (!ticker) return rows;
  return rows.filter((row) => String(row.ticker || '').toUpperCase() === String(ticker).toUpperCase());
};

const nextUpcomingEvent = (ticker) =>
  filterByTicker(MOCK_EVENTS, ticker)
    .filter((event) => event.status === 'UPCOMING')
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

const normalizeDashboardRow = (row) => ({
  ...row,
  daily_change_pct: row?.daily_change_pct ?? row?.daily_change_percent ?? null,
  needs_attention: Boolean(row?.needs_attention),
  changed_since_last_analysis: Boolean(row?.changed_since_last_analysis ?? row?.alert_flag ?? row?.needs_attention)
});

const dashboardOverviewMock = () => ({
  generated_at: mockNow,
  stocks: [...MOCK_STOCKS]
    .sort((a, b) => {
      const alertDelta = Number(b.alert_flag) - Number(a.alert_flag);
      if (alertDelta !== 0) return alertDelta;
      const convictionDelta = Number(b.current_conviction || 0) - Number(a.current_conviction || 0);
      if (convictionDelta !== 0) return convictionDelta;
      return a.ticker.localeCompare(b.ticker);
    })
    .map((stock) => {
      const event = nextUpcomingEvent(stock.ticker);
      const catalystCount = MOCK_CATALYSTS.filter((item) => item.ticker === stock.ticker && Number(item.significance || 0) >= 4).length;
      return {
        ticker: stock.ticker,
        company_name: stock.company_name,
        current_price: stock.current_price,
        daily_change_pct: stock.daily_change_percent,
        current_verdict: stock.current_verdict,
        current_action: stock.current_action,
        current_conviction: stock.current_conviction,
        one_line_summary: stock.current_thesis,
        active_catalyst_count: catalystCount,
        next_event_date: event?.date || null,
        next_event_description: event?.description || null,
        next_event_type: event?.event_type || null,
        last_analysis_date: stock.last_analysis_date,
        open_position_flag: stock.open_position_flag,
        alert_flag: stock.alert_flag,
        needs_attention: stock.needs_attention,
        changed_since_last_analysis: stock.alert_flag || stock.needs_attention
      };
    })
    .map(normalizeDashboardRow)
});

const analysisRunResultMock = (ticker, extractionId, notes) => ({
  run_id: `RUN_2026-03-23_120000_${String(ticker || 'MP').toUpperCase()}`,
  ticker: String(ticker || 'MP').toUpperCase(),
  status: 'PENDING',
  extraction_id: extractionId ?? null,
  final_verdict: null,
  final_action: null,
  final_conviction: null,
  one_line_summary: notes || null,
  synthesis_text: null,
  frontier_review_status: 'PENDING'
});

const normalizePromptPayload = (payload, sourcePath) => {
  if (typeof payload === 'string') {
    return { prompt_text: payload, source_path: sourcePath };
  }
  if (payload && typeof payload === 'object') {
    const promptText =
      payload.text ||
      payload.prompt_text ||
      payload.prompt ||
      payload.content ||
      payload.generated_prompt ||
      payload.user_prompt ||
      null;
    if (promptText) {
      return { ...payload, prompt_text: String(promptText), source_path: sourcePath };
    }
    if (payload.system_prompt || payload.user_prompt) {
      const sections = [
        payload.system_prompt ? `System prompt\n${payload.system_prompt}` : null,
        payload.user_prompt ? `User prompt\n${payload.user_prompt}` : null
      ].filter(Boolean);
      return { ...payload, prompt_text: sections.join('\n\n'), source_path: sourcePath };
    }
    return { ...payload, prompt_text: safeStringify(payload), source_path: sourcePath };
  }
  return { prompt_text: String(payload ?? ''), source_path: sourcePath };
};

const mockPromptResult = (payload = {}) => {
  const ticker = String(payload.ticker || payload.scope || 'MP').toUpperCase();
  const promptType = String(payload.prompt_type || payload.template || 'DELTA_EXTRACTION').toUpperCase();
  const focus = payload.focus || payload.custom_focus || 'Decision clarity, downside control, catalyst timing, and next action.';
  const mode = payload.mode || 'DELTA';
  const extraContext = payload.context || payload.notes || payload.raw_text || 'Use the latest stock snapshot, catalyst stack, upcoming events, funding detail, and journal context.';
  const promptText = [
    `You are preparing a ${promptType.replace(/_/g, ' ')} for ${ticker}.`,
    `Mode: ${mode}.`,
    `Focus: ${focus}.`,
    'Required sections:',
    '1. One-line setup summary',
    '2. Decision stance with verdict, action, and conviction',
    '3. Key levels using the latest price snapshot',
    '4. Catalyst timeline and next event scenarios',
    '5. Government funding relevance',
    '6. Risks, invalidation, and what would change the call',
    '',
    'Context:',
    extraContext
  ].join('\n');
  return {
    prompt_text: promptText,
    source_path: 'mock://prompt-generator',
    prompt_type: promptType,
    ticker
  };
};

export const api = {
  listStocks: (options = {}) => requestWithFallback('/api/stocks', { signal: options.signal }, tickerList),
  getDashboardOverview: async (options = {}) => {
    const payload = await requestWithFallback('/api/dashboard/overview', { signal: options.signal }, dashboardOverviewMock);
    return {
      ...payload,
      stocks: (payload?.stocks || []).map(normalizeDashboardRow)
    };
  },
  getStock: (ticker, options = {}) =>
    requestWithFallback(`/api/stocks/${encodeURIComponent(String(ticker).toUpperCase())}`, { signal: options.signal }, () => getMockStock(ticker)),
  getLatestPrice: async (ticker, options = {}) => {
    const path = buildQuery('/api/prices/latest', { ticker: String(ticker || '').toUpperCase() });
    try {
      return await request(path, { signal: options.signal });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      if (!shouldFallback(error)) throw error;
      await delay(150);
      return clone(getMockLatestPrice(ticker));
    }
  },
  getAnalysisHistory: (ticker, options = {}) =>
    requestWithFallback(
      buildQuery('/api/analysis/history', { ticker: String(ticker || '').toUpperCase() }),
      { signal: options.signal },
      () => {
        const stock = getMockStock(ticker);
        if (!stock) return [];
        return [
          {
            run_id: `RUN_2026-03-23_120000_${stock.ticker}`,
            ticker: stock.ticker,
            status: 'COMPLETE',
            started_at: stock.last_analysis_date,
            completed_at: stock.last_analysis_date,
            final_verdict: stock.current_verdict,
            final_action: stock.current_action,
            final_conviction: stock.current_conviction,
            entry_low: stock.entry_low ?? null,
            entry_high: stock.entry_high ?? null,
            stop_loss: stock.current_stop ?? null,
            target_price: stock.current_target ?? null,
            timeframe: stock.timeframe ?? null,
            one_line_summary: stock.current_thesis,
            changed_since_last_analysis: Boolean(stock.alert_flag || stock.needs_attention)
          },
          ...(stock.analysis_trail || []).map((item) => ({
            run_id: item.id,
            ticker: stock.ticker,
            status: item.stage || 'COMPLETE',
            started_at: item.created_at,
            completed_at: item.created_at,
            final_verdict: item.verdict,
            final_action: null,
            final_conviction: item.conviction,
            one_line_summary: item.summary,
            changed_since_last_analysis: false
          }))
        ];
      }
    ),
  getAnalysisTrail: (ticker, options = {}) =>
    requestWithFallback(
      buildQuery('/api/analysis/trail', { ticker: String(ticker || '').toUpperCase(), limit: options.limit || 24 }),
      { signal: options.signal },
      () =>
        (getMockStock(ticker)?.analysis_trail || []).map((item, index) => ({
          id: item.id || `${ticker}-${index + 1}`,
          run_id: item.id || `${ticker}-${index + 1}`,
          ticker: String(ticker || '').toUpperCase(),
          agent_number: index + 1,
          agent_name: item.owner || item.stage || `Review ${index + 1}`,
          agent_kind: 'specialist',
          parse_status: 'COMPLETE',
          model: 'mock',
          error_message: null,
          created_at: item.created_at,
          raw_markdown: [item.summary, ...(item.bullets || []), ...(item.risks || [])].filter(Boolean).join('\n'),
          parsed_json: {
            verdict: item.verdict,
            conviction: item.conviction,
            summary: item.summary,
            bullets: item.bullets || [],
            risks: item.risks || []
          },
          run_status: item.stage || 'COMPLETE',
          run_verdict: item.verdict,
          run_action: null,
          run_conviction: item.conviction,
          title: item.title
        }))
    ),
  getCatalysts: ({ ticker, signal } = {}) =>
    requestWithFallback(
      `/api/catalysts${ticker ? `?ticker=${encodeURIComponent(String(ticker).toUpperCase())}` : ''}`,
      { signal },
      () => filterByTicker(MOCK_CATALYSTS, ticker)
    ),
  getEvents: ({ ticker, signal } = {}) =>
    requestWithFallback(
      `/api/events${ticker ? `?ticker=${encodeURIComponent(String(ticker).toUpperCase())}` : ''}`,
      { signal },
      () => filterByTicker(MOCK_EVENTS, ticker)
    ),
  getResearch: ({ ticker, signal } = {}) =>
    requestWithFallback(
      `/api/research${ticker ? `?ticker=${encodeURIComponent(String(ticker).toUpperCase())}` : ''}`,
      { signal },
      () => filterByTicker(MOCK_RESEARCH, ticker)
    ),
  getJournal: ({ ticker, signal } = {}) =>
    requestWithFallback(
      `/api/journal${ticker ? `?ticker=${encodeURIComponent(String(ticker).toUpperCase())}` : ''}`,
      { signal },
      () => filterByTicker(MOCK_JOURNAL, ticker)
    ),
  ingestExtraction: (payload, options = {}) =>
    requestWithFallback('/api/extractions/ingest', { method: 'POST', body: payload, signal: options.signal }, () => ({
      extraction_id: 501,
      parse_status: 'COMPLETE',
      canonical_appendix: {
        NEW_CATALYSTS: [],
        UPCOMING_EVENTS: [],
        PRICE_SNAPSHOTS: []
      },
      counters: {
        catalysts_extracted: 3,
        events_extracted: 2,
        prices_extracted: 1,
        notes_created: 2
      }
    })),
  createAnalysisRun: (payload, options = {}) =>
    requestWithFallback('/api/analysis/runs', { method: 'POST', body: payload, signal: options.signal }, () =>
      analysisRunResultMock(payload.ticker, payload.extraction_id, payload.notes)
    ),
  generateAnalysisTasks: (runId, options = {}) =>
    requestWithFallback(`/api/analysis/runs/${encodeURIComponent(runId)}/generate-tasks`, { method: 'POST', signal: options.signal }, () => ({
      run_id: runId,
      task_files: {
        1: '01_catalyst_policy.md',
        2: '02_price_action.md',
        3: '03_risk_positioning.md',
        4: '04_fundamentals_capital_structure.md',
        5: '05_options_positioning.md',
        6: '06_macro_commodity_context.md',
        7: '07_management_execution.md',
        8: '08_relative_value.md',
        9: '09_consistency_checker.md',
        10: '10_synthesis_writer.md'
      }
    })),
  executeAnalysisRun: (runId, options = {}) =>
    requestWithFallback(`/api/analysis/runs/${encodeURIComponent(runId)}/execute`, { method: 'POST', signal: options.signal }, () => ({
      run: {
        ...analysisRunResultMock('MP'),
        run_id: runId
      },
      execution: clone(MOCK_ANALYSIS.execution)
    })),
  ingestFrontier: (payload, options = {}) =>
    requestWithFallback('/api/frontier/ingest', { method: 'POST', body: payload, signal: options.signal }, () => ({
      run_id: payload.run_id,
      parsed: clone(MOCK_ANALYSIS.frontier)
    })),
  generatePrompt: async (payload, options = {}) => {
    const promptType = String(payload.prompt_type || payload.template || 'DELTA_EXTRACTION').toUpperCase();
    const scope = payload.scope || payload.ticker || 'ALL';
    let paths = [];

    if (promptType === 'FULL_EXTRACTION' || promptType === 'DELTA_EXTRACTION') {
      paths = [
        buildQuery('/api/prompts/extraction', {
          mode: promptType === 'FULL_EXTRACTION' ? 'FULL_SCAN' : (payload.mode || 'DELTA'),
          scope
        })
      ];
    } else if (promptType === 'SENIOR_REVIEW') {
      paths = [buildQuery('/api/prompts/senior-review', { run_id: payload.run_id })];
    } else if (promptType === 'FINAL_OVERSIGHT') {
      paths = [buildQuery('/api/prompts/final-oversight', { run_id: payload.run_id })];
    } else {
      paths = [buildQuery('/api/prompts/extraction', { mode: payload.mode || 'DELTA', scope })];
    }

    try {
      const result = await requestFirstAvailable(paths, { signal: options.signal });
      return normalizePromptPayload(result.payload, result.path);
    } catch (error) {
      if (!(shouldFallback(error) || (error instanceof ApiError && [400, 404, 405, 422, 501].includes(error.status)))) {
        throw error;
      }
      await delay(120);
      return mockPromptResult(payload);
    }
  }
};

export const mockDomain = {
  stocks: clone(MOCK_STOCKS),
  catalysts: clone(MOCK_CATALYSTS),
  events: clone(MOCK_EVENTS),
  research: clone(MOCK_RESEARCH),
  journal: clone(MOCK_JOURNAL)
};
