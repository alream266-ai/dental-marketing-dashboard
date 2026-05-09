SYSTEM = """You are a dental marketing analyst specializing in Canadian dental practices.
Extract structured brand information from dental office website content.
Return valid JSON only. If information is not present, use null or empty string."""

USER_TEMPLATE = """Analyze this dental office website content and extract the brand profile.

Website content:
{content}

Return a JSON object with exactly these fields:
{{
  "practice_name": "string",
  "location": "city, province",
  "phone": "string",
  "address": "string",
  "brand_tone": "one of: warm, clinical, premium, community-focused, professional",
  "mission": "1-2 sentence mission statement extracted or inferred",
  "target_audience": ["list", "of", "audience", "types"],
  "services": ["list", "of", "services"],
  "value_props": ["unique", "selling", "points"],
  "doctor_names": ["list", "of", "doctor", "names"],
  "accepts_new_patients": true,
  "hours_summary": "string"
}}"""
