---
name: seed-data
description: Seed the database with stock profiles and any historical data
---

Steps:
1. Run: cd backend && python ../scripts/seed_stocks.py
2. Verify: curl http://localhost:8000/api/stocks | python -m json.tool
3. Report the number of stocks seeded and any errors
