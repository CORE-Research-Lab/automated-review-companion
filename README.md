# publication_scraper
Web Scraping Publications

## Dataset Description
- `master.csv` contains the latest search result, unfiltered. It will contain duplicates and publications that are not in English.
- `master-v2.csv` contains the cleaned search result using the full list of keywords (including "Yi"), and DBLP _without_ tertiary keywords.
- `master-v3.csv` contains the cleaned search result using the refined list of keywords (including "Yi 6B"), and DBLP _with_ tertiary keywords.
- `*-full.csv` contains the complete metadata of publications from the search result.
