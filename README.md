# publication_scraper
Web Scraping Publications
## Setup Instructions

### Backend Setup
1. Create and activate virtual environment:
```bash
cd publication-scraper-backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment variables:
```bash
cp .env.example .env  # Create your .env file from template and fill in required values
```

Required environment variables in .env:
```plaintext
AZURE_RESOURCE_NAME=your_azure_resource_name    # Azure OpenAI resource name
AZURE_API_KEY=your_azure_api_key               # Azure OpenAI API key
AZURE_DEPLOYMENT_NAME=your_deployment_name      # Azure OpenAI deployment name
SEMANTIC_SCHOLAR_KEY=your_key                  # API key for Semantic Scholar
WOS_KEY=your_key                              # Web of Science API key
SCOPUS_KEY=your_key                           # Scopus API key
OPENAI_API_KEY=your_key                       # OpenAI API key

```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development server:
```bash
python manage.py runserver
```
The backend will be available at http://localhost:8000

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd publication-scraper-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
The frontend will be available at http://localhost:3000
