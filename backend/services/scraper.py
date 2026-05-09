import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional


async def scrape_website(url: str, max_pages: int = 8) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DentalMarketingBot/1.0)"
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
                continue

    return "\n\n".join(all_text)[:30000]
