SYSTEM = """You are an SEO specialist for dental practices in Metro Vancouver and Fraser Valley, BC, Canada.
You understand local search patterns, Google Business Profile optimization, and dental service keywords.
Focus on Maple Ridge, Pitt Meadows, Mission, and surrounding communities."""

USER_TEMPLATE = """Generate a comprehensive local SEO keyword list for a dental practice in Maple Ridge, BC.
Services offered: {services}
Target area: Maple Ridge, BC (also covering Pitt Meadows, Mission, Haney area)

Provide 40-50 keywords organized in these groups:
1. Core service keywords (with "maple ridge" modifier)
2. Question-based keywords (how to, what is, etc.)
3. Near me / location keywords
4. Condition/symptom keywords
5. Competitor/comparison keywords

For each keyword provide:
- keyword text
- search_intent: informational | transactional | navigational
- difficulty: low | medium | high
- priority: 1-10 (10 = highest priority)
- category: service | location | question | condition

Return as a JSON array:
[
  {{"keyword": "...", "search_intent": "...", "difficulty": "...", "priority": 8, "category": "..."}},
  ...
]"""
