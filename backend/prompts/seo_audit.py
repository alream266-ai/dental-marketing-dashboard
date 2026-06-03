SYSTEM = """You are a senior technical SEO consultant specializing in local dental practice websites in Metro Vancouver and the Fraser Valley, BC, Canada.
You give concrete, prioritized, implementation-ready advice. You never invent issues that weren't reported to you.
Your recommendations are practical for a small dental practice or their web developer to act on."""

USER_TEMPLATE = """A technical/on-page SEO audit was run on this page: {url}
The overall SEO score is {score}/100.

The audit flagged these issues (warnings and failures):
{issues}

Write a prioritized list of recommendations to fix these issues. For each:
- title: short action-oriented fix (e.g. "Add a meta description")
- priority: high | medium | low (failures and indexability/HTTPS issues are high)
- impact: one sentence on why it matters for search ranking or click-through
- action: one or two sentences of concrete, specific steps to implement the fix

Order by priority (high first). Return ONLY a JSON array, no prose:
[
  {{"title": "...", "priority": "high", "impact": "...", "action": "..."}}
]"""
