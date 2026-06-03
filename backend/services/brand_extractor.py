import json
from services.scraper import scrape_website
from services.claude_client import generate
from prompts.brand_analysis import SYSTEM, USER_TEMPLATE
from models.brand import BrandProfile


async def extract_brand_profile(url: str) -> BrandProfile:
    raw_content = await scrape_website(url)
    user_prompt = USER_TEMPLATE.format(content=raw_content)
    response_text = generate(SYSTEM, user_prompt)

    start = response_text.find("{")
    end = response_text.rfind("}") + 1
    data = json.loads(response_text[start:end])

    accepts_new = data.get("accepts_new_patients")
    if accepts_new is None:
        accepts_new = True

    profile = BrandProfile(
        website_url=url,
        practice_name=data.get("practice_name") or "",
        location=data.get("location") or "",
        phone=data.get("phone") or "",
        address=data.get("address") or "",
        brand_tone=data.get("brand_tone") or "professional",
        mission=data.get("mission") or "",
        target_audience_json=json.dumps(data.get("target_audience") or []),
        services_json=json.dumps(data.get("services") or []),
        value_props_json=json.dumps(data.get("value_props") or []),
        doctor_names_json=json.dumps(data.get("doctor_names") or []),
        accepts_new_patients=accepts_new,
        hours_summary=data.get("hours_summary") or "",
        raw_content=raw_content[:5000],
    )
    return profile
