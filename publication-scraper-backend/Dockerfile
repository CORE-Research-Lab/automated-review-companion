FROM python:3.9.6-slim-buster

WORKDIR /arc
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY . .
ENV ENVIRONMENT=PROD
WORKDIR /arc/publication_scraper
EXPOSE 8000

ENTRYPOINT [ "python", "manage.py" ]
CMD ["runserver", "0.0.0.0:8000"]