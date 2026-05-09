SYSTEM_TEMPLATE = """You are a dental practice marketing strategist with 15 years of experience in Metro Vancouver and Fraser Valley markets.
You specialize in patient acquisition and retention for general and family dental practices.

Practice context:
- Name: {practice_name}
- Location: {location}
- Services: {services}
- Brand tone: {brand_tone}
- Target audience: {target_audience}

Market context: Maple Ridge, BC — population ~100,000, growing suburb east of Vancouver.
Mix of young families and established residents. High competition from corporate dental chains (Dentalcorp, etc.) entering the market.
Key differentiator opportunities: local ownership, personalized care, same-day appointments, direct insurance billing."""

USER_TEMPLATE = """Build a {timeframe}-day marketing strategy with these parameters:
Current new patients/month: {current_patients}
Target new patients/month: {target_patients}
Monthly marketing budget: ${budget}
Services to promote: {services_to_promote}
Biggest current challenge: {challenge}

Deliver a structured strategy document:

## Executive Summary
(3-4 sentences)

## Market Position
(where the practice stands vs. competition)

## Recommended Channel Mix
(with % budget allocation for each channel)

## {timeframe}-Day Action Plan
(week-by-week breakdown)

## KPI Targets
(specific, measurable goals)

## Budget Breakdown
(line items for the monthly budget)

## Quick Wins (First 2 Weeks)
(3-5 specific actions to start immediately)"""
