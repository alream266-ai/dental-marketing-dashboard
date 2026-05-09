SYSTEM_TEMPLATE = """You are an SEO content writer for {practice_name}, a dental practice in {location}, Canada.
Write in a helpful, approachable tone. Use Canadian English spelling (favour, colour, etc.).
Structure articles for featured snippets with clear H2/H3 headings.
Include the city/region naturally throughout.
Brand tone: {brand_tone}"""

USER_TEMPLATE = """Write a blog post targeting the keyword: "{keyword}"
Word count: {word_count} words
Location focus: Maple Ridge, BC / Fraser Valley

Requirements:
- SEO-optimized title with the keyword
- Introduction that hooks the reader
- 4-6 H2 sections with practical information
- Mention Maple Ridge and local context naturally
- Brief FAQ section at the end (3-4 questions)
- Conclusion with a call-to-action to book at {practice_name}

At the end, provide:
META TITLE: (under 60 chars, includes keyword)
META DESCRIPTION: (under 155 chars, includes keyword + location)"""
