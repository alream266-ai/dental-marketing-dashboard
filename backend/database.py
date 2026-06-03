import ssl
from sqlmodel import SQLModel, create_engine, Session
from config import get_settings

settings = get_settings()

url = settings.database_url
connect_args = {}

if url.startswith(("postgresql://", "postgres://")):
    # Use pure-Python pg8000 driver (no C compilation needed on Vercel)
    url = url.replace("postgresql://", "postgresql+pg8000://", 1)
    url = url.replace("postgres://", "postgresql+pg8000://", 1)
    # pg8000 doesn't understand libpq query params like sslmode — strip them
    if "?" in url:
        url = url.split("?", 1)[0]
    # Neon requires TLS
    connect_args = {"ssl_context": ssl.create_default_context()}

engine = create_engine(url, echo=False, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
