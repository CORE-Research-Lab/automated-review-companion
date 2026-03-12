FROM python:3.9.6-slim-buster

WORKDIR /arc
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY . .
ENV ENVIRONMENT=PROD
WORKDIR /arc/publication_scraper
EXPOSE 8000

CMD ["sh", "-c", "gunicorn publication_scraper.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4 --timeout 120"]