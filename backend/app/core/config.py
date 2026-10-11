import os

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        APP_NAME: str = "CredIntel AI"
        VERSION: str = "1.0.0"
        DB_HOST: str = "localhost"
        DB_PORT: int = 3306
        DB_NAME: str = "credintel"
        DB_USER: str = "root"
        DB_PASSWORD: str = "password"
        MODEL_PATH: str = "app/ml/models/loan_model_v1.joblib"
        OPENAI_API_KEY: str = ""
        GOOGLE_API_KEY: str = ""

        class Config:
            env_file = ".env"

    settings = Settings()

except ImportError:
    # Fallback: plain object reading from environment variables / .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    class _Settings:  # type: ignore[no-redef]
        APP_NAME: str = os.getenv("APP_NAME", "CredIntel AI")
        VERSION: str = os.getenv("VERSION", "1.0.0")
        DB_HOST: str = os.getenv("DB_HOST", "localhost")
        DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
        DB_NAME: str = os.getenv("DB_NAME", "credintel")
        DB_USER: str = os.getenv("DB_USER", "root")
        DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
        MODEL_PATH: str = os.getenv("MODEL_PATH", "app/ml/models/loan_model_v1.joblib")
        OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    settings = _Settings()
