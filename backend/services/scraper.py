import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional


async def scrape_website(url: str, max_pages: int = 8) -> str:
    # Use a realistic browser User-Agent and headers. Custom/bot UAs are
    # frequently rejected with 403 by site firewalls (e.g. Cloudflare).
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
                  "image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    visited = set()
    all_text = []
    to_visit = [url]
    base_domain = urlparse(url).netloc

    async with httpx.AsyncClient(headers=headers, timeout=20, follow_redirects=True) as client:
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)

            try:
                resp = await client.get(current_url)
                if resp.status_code != 200:
                    # Surface a clear error for the entry page so the user
                    # isn't left with a silently empty brand profile.
                    if current_url == url:
                        raise RuntimeError(
                            f"Could not fetch {url} (HTTP {resp.status_code}). "
                            "The site may be blocking automated requests."
                        )
                    continue
                soup = BeautifulSoup(resp.text, "html.parser")

                for tag in soup(["script", "style", "nav", "footer", "header"]):
                    tag.decompose()

                page_text = soup.get_text(separator=" ", strip=True)
                page_text = " ".join(page_text.split())
                all_text.append(f"=== PAGE: {current_url} ===\n{page_text}")

                if len(visited) < max_pages:
                    for a in soup.find_all("a", href=True):
                        href = urljoin(current_url, a["href"])
                        parsed = urlparse(href)
                        if parsed.netloc == base_domain and href not in visited:
                            path = parsed.path.lower()
                            if any(k in path for k in ["about", "service", "team", "contact", "treatment", "dental", "care"]):
                                to_visit.append(href)
            except Exception:
                # Fail loudly if even the entry page can't be processed;
                # otherwise skip the problematic sub-page and keep going.
                if current_url == url:
                    raise
                continue

    if not all_text:
        raise RuntimeError(
            f"No readable content found at {url}. The site may require "
            "JavaScript to render or be blocking automated requests."
        )

    return "\n\n".join(all_text)[:30000]
