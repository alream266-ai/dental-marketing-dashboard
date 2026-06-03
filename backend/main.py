from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import (
    website_analyzer, content_studio, campaigns,
    leads, reviews, analytics, seo, strategy
)

app = FastAPI(title="Dental Marketing Dashboard", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.include_router(website_analyzer.router, prefix="/api", tags=["Website Analyzer"])
app.include_router(content_studio.router, prefix="/api", tags=["Content Studio"])
app.include_router(campaigns.router, prefix="/api", tags=["Campaigns"])
app.include_router(leads.router, prefix="/api", tags=["Leads"])
app.include_router(reviews.router, prefix="/api", tags=["Reviews"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(seo.router, prefix="/api", tags=["SEO"])
app.include_router(strategy.router, prefix="/api", tags=["Strategy"])


@app.get("/")
def root():
    return {"status": "Dental Marketing Dashboard running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
