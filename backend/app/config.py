from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env if present for local development
ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)
