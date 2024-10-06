# publication_scraper
Web Scraping Publications

# Supported Function
- `search-and-clean`: This file is responsible for searching through the raw data and cleaning it. It removes duplicates, non-English publications, and any irrelevant data to provide a clean, usable dataset for further analysis.

- `snowballing`: This file is used for the snowballing process in systematic literature reviews. It takes a set of initial papers and finds all papers that cite them or are cited by them, expanding the datas

- `get-paper-metadata`: This file is used to get the metadata of a paper from its DOI. It uses the Crossref API to get the metadata of a paper from its DOI.

- `validation`: The validation file is used to validate the results of the search and cleaning process. It checks the cleaned data against a set of predefined criteria or a validation dataset to ensure the data is accurate and ready for analysis.


## Dataset Description (deprecated)
- `master.csv` contains the latest search result, unfiltered. It will contain duplicates and publications that are not in English.
- `master-v2.csv` contains the cleaned search result using the full list of keywords (including "Yi"), and DBLP _without_ tertiary keywords.
- `master-v3.csv` contains the cleaned search result using the refined list of keywords (including "Yi 6B"), and DBLP _with_ tertiary keywords.
- `*-full.csv` contains the complete metadata of publications from the search result.
