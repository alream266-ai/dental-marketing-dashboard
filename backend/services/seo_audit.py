"""Professional on-page / technical SEO audit.

Fetches a single page, runs a set of deterministic technical checks, computes a
weighted 0-100 score (overall + per category), and asks Claude for a prioritized
list of fixes based on the issues found.
"""
import json
import re
from urllib.parse import urlparse, urljoin

import httpx
from bs4 import BeautifulSoup

from services.claude_client import generate
from prompts.seo_audit import SYSTEM, USER_TEMPLATE


BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
              "image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Status weights: a "pass" earns full points, "warn" half, "fail" none.
_STATUS_SCORE = {"pass": 1.0, "warn": 0.5, "fail": 0.0}


async def _fetch_rendered(url: str):
    """Render the page in headless Chromium and return the post-JavaScript DOM.

    Returns (final_url, status_code, html, content_bytes, render_mode).
    Falls back to a plain httpx GET if the browser is unavailable.
    """
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(args=["--no-sandbox"])
            context = await browser.new_context(
                user_agent=BROWSER_HEADERS["User-Agent"],
                locale="en-US",
            )
            page = await context.new_page()
            resp = await page.goto(url, wait_until="networkidle", timeout=30000)
            status = resp.status if resp else 0
            final_url = page.url
            html = await page.content()
            await browser.close()
            return final_url, status, html, len(html.encode("utf-8")), "rendered"
    except Exception:
        # Fallback: raw HTML without JavaScript execution.
        async with httpx.AsyncClient(headers=BROWSER_HEADERS, timeout=25,
                                     follow_redirects=True) as client:
            resp = await client.get(url)
        return str(resp.url), resp.status_code, resp.text, len(resp.content), "static"


def _check(category, label, status, detail, weight=1.0, recommendation=""):
    return {
        "category": category,
        "label": label,
        "status": status,
        "detail": detail,
        "weight": weight,
        "recommendation": recommendation,
    }


async def run_seo_audit(url: str) -> dict:
    if not urlparse(url).scheme:
        url = "https://" + url

    final_url, status, html, page_bytes, render_mode = await _fetch_rendered(url)
    if status and status != 200:
        raise RuntimeError(
            f"Could not fetch {url} (HTTP {status}). "
            "The site may be blocking automated requests."
        )

    soup = BeautifulSoup(html, "html.parser")
    checks = []

    # --- Title tag ---
    title = (soup.title.string or "").strip() if soup.title else ""
    tlen = len(title)
    if not title:
        checks.append(_check("Meta & Titles", "Title tag", "fail",
                             "No <title> tag found.", 2.0))
    elif tlen < 30 or tlen > 60:
        checks.append(_check("Meta & Titles", "Title tag", "warn",
                             f"Title is {tlen} chars (ideal 30–60): \"{title}\"", 2.0))
    else:
        checks.append(_check("Meta & Titles", "Title tag", "pass",
                             f"{tlen} chars: \"{title}\"", 2.0))

    # --- Meta description ---
    md = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    desc = (md.get("content") or "").strip() if md else ""
    dlen = len(desc)
    if not desc:
        checks.append(_check("Meta & Titles", "Meta description", "fail",
                             "No meta description found.", 2.0))
    elif dlen < 120 or dlen > 160:
        checks.append(_check("Meta & Titles", "Meta description", "warn",
                             f"Description is {dlen} chars (ideal 120–160).", 2.0))
    else:
        checks.append(_check("Meta & Titles", "Meta description", "pass",
                             f"{dlen} chars.", 2.0))

    # --- H1 ---
    h1s = soup.find_all("h1")
    if len(h1s) == 0:
        checks.append(_check("Headings", "H1 heading", "fail",
                             "No <h1> found on the page.", 1.5))
    elif len(h1s) > 1:
        checks.append(_check("Headings", "H1 heading", "warn",
                             f"{len(h1s)} <h1> tags found (use exactly one).", 1.5))
    else:
        checks.append(_check("Headings", "H1 heading", "pass",
                             f"One <h1>: \"{h1s[0].get_text(strip=True)[:60]}\"", 1.5))

    # --- Heading structure ---
    h2s = soup.find_all("h2")
    if h2s:
        checks.append(_check("Headings", "Subheadings (H2)", "pass",
                             f"{len(h2s)} <h2> subheadings present.", 1.0))
    else:
        checks.append(_check("Headings", "Subheadings (H2)", "warn",
                             "No <h2> subheadings — add structure to content.", 1.0))

    # --- Word count ---
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = " ".join(soup.get_text(separator=" ", strip=True).split())
    words = len(text.split())
    if words < 300:
        checks.append(_check("Content", "Content depth", "fail",
                             f"Only ~{words} words (aim for 300+).", 1.5))
    elif words < 600:
        checks.append(_check("Content", "Content depth", "warn",
                             f"~{words} words — thin for a key page.", 1.5))
    else:
        checks.append(_check("Content", "Content depth", "pass",
                             f"~{words} words.", 1.5))

    # --- Image alt text ---
    imgs = soup.find_all("img")
    if imgs:
        with_alt = sum(1 for i in imgs if (i.get("alt") or "").strip())
        pct = round(with_alt / len(imgs) * 100)
        if pct >= 90:
            st = "pass"
        elif pct >= 50:
            st = "warn"
        else:
            st = "fail"
        checks.append(_check("Images", "Image alt text", st,
                             f"{with_alt}/{len(imgs)} images ({pct}%) have alt text.", 1.0))
    else:
        checks.append(_check("Images", "Image alt text", "warn",
                             "No images found on the page.", 1.0))

    # --- Canonical ---
    canonical = soup.find("link", attrs={"rel": re.compile("canonical", re.I)})
    if canonical and canonical.get("href"):
        checks.append(_check("Technical", "Canonical URL", "pass",
                             f"Canonical set: {canonical['href']}", 1.0))
    else:
        checks.append(_check("Technical", "Canonical URL", "warn",
                             "No canonical link — add to avoid duplicate content.", 1.0))

    # --- Robots / indexability ---
    robots = soup.find("meta", attrs={"name": re.compile("^robots$", re.I)})
    robots_val = (robots.get("content") or "").lower() if robots else ""
    if "noindex" in robots_val:
        checks.append(_check("Technical", "Indexability", "fail",
                             "Page is set to noindex — it won't appear in search.", 2.0))
    else:
        checks.append(_check("Technical", "Indexability", "pass",
                             "Page is indexable.", 2.0))

    # --- HTTPS ---
    if urlparse(final_url).scheme == "https":
        checks.append(_check("Technical", "HTTPS", "pass",
                             "Served securely over HTTPS.", 1.5))
    else:
        checks.append(_check("Technical", "HTTPS", "fail",
                             "Not served over HTTPS.", 1.5))

    # --- Viewport / mobile ---
    viewport = soup.find("meta", attrs={"name": re.compile("^viewport$", re.I)})
    if viewport and viewport.get("content"):
        checks.append(_check("Mobile", "Mobile viewport", "pass",
                             "Responsive viewport meta tag present.", 1.5))
    else:
        checks.append(_check("Mobile", "Mobile viewport", "fail",
                             "No viewport meta tag — not mobile-friendly.", 1.5))

    # --- Lang attribute ---
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        checks.append(_check("Technical", "Language attribute", "pass",
                             f"lang=\"{html_tag.get('lang')}\"", 0.5))
    else:
        checks.append(_check("Technical", "Language attribute", "warn",
                             "No lang attribute on <html>.", 0.5))

    # --- Structured data ---
    ld = soup.find_all("script", attrs={"type": "application/ld+json"})
    types = []
    for s in ld:
        try:
            data = json.loads(s.string or "{}")
            items = data if isinstance(data, list) else [data]
            for it in items:
                t = it.get("@type")
                if t:
                    types.append(t if isinstance(t, str) else ", ".join(t))
        except Exception:
            continue
    if types:
        st = "pass" if any("dent" in t.lower() or "localbusiness" in t.lower()
                           or "medicalbusiness" in t.lower() for t in types) else "warn"
        checks.append(_check("Structured Data", "Schema.org markup", st,
                             f"JSON-LD found: {', '.join(sorted(set(types)))}", 1.5))
    else:
        checks.append(_check("Structured Data", "Schema.org markup", "fail",
                             "No JSON-LD structured data — add Dentist/LocalBusiness schema.", 1.5))

    # --- Open Graph (social) ---
    og = soup.find("meta", attrs={"property": re.compile("^og:title$", re.I)})
    if og and og.get("content"):
        checks.append(_check("Social", "Open Graph tags", "pass",
                             "Open Graph tags present for social sharing.", 0.5))
    else:
        checks.append(_check("Social", "Open Graph tags", "warn",
                             "No Open Graph tags — links won't preview well when shared.", 0.5))

    # --- Page weight (rough performance signal) ---
    kb = round(page_bytes / 1024)
    if kb > 3000:
        checks.append(_check("Performance", "HTML page weight", "warn",
                             f"HTML payload is {kb} KB — large; consider trimming.", 0.5))
    else:
        checks.append(_check("Performance", "HTML page weight", "pass",
                             f"HTML payload is {kb} KB.", 0.5))

    # --- Scoring ---
    categories = {}
    for c in checks:
        cat = categories.setdefault(c["category"], {"earned": 0.0, "possible": 0.0})
        cat["earned"] += _STATUS_SCORE[c["status"]] * c["weight"]
        cat["possible"] += c["weight"]

    category_scores = [
        {"category": name,
         "score": round(v["earned"] / v["possible"] * 100) if v["possible"] else 0}
        for name, v in categories.items()
    ]
    total_earned = sum(v["earned"] for v in categories.values())
    total_possible = sum(v["possible"] for v in categories.values())
    overall = round(total_earned / total_possible * 100) if total_possible else 0

    counts = {
        "pass": sum(1 for c in checks if c["status"] == "pass"),
        "warn": sum(1 for c in checks if c["status"] == "warn"),
        "fail": sum(1 for c in checks if c["status"] == "fail"),
    }

    # --- AI recommendations for the issues found ---
    issues = [c for c in checks if c["status"] != "pass"]
    recommendations = []
    if issues:
        issue_lines = "\n".join(
            f"- [{c['status'].upper()}] {c['label']} ({c['category']}): {c['detail']}"
            for c in issues
        )
        try:
            user_prompt = USER_TEMPLATE.format(
                url=final_url, score=overall, issues=issue_lines
            )
            raw = generate(SYSTEM, user_prompt)
            s, e = raw.find("["), raw.rfind("]") + 1
            recommendations = json.loads(raw[s:e])
        except Exception:
            recommendations = []

    return {
        "url": final_url,
        "render_mode": render_mode,
        "overall_score": overall,
        "grade": _grade(overall),
        "counts": counts,
        "category_scores": sorted(category_scores, key=lambda x: x["score"]),
        "checks": checks,
        "recommendations": recommendations,
    }


def _grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"
