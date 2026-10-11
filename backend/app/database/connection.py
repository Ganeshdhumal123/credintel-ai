from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from datetime import datetime, timezone
from typing import Generator

DATABASE_URL = "sqlite:///./credintel.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(36), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="pending")
    applicant_data = Column(Text, nullable=True)  # JSON stored as Text


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(36), ForeignKey("applications.application_id"), nullable=False, index=True)
    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    risk_category = Column(String(20), nullable=False)
    model_version = Column(String(50), nullable=False)
    analyzed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    explanation = Column(Text, nullable=True)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False)
    application_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
