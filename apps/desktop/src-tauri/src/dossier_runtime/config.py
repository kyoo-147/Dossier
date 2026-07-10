import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    state_root: str = os.getenv("DOSSIER_STATE_ROOT", "./state")
    
settings = Settings()
