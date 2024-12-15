export const tooltipText = {
  usabilityGuide: "Click to view the usability guide",
  changelog: "Click to view the changelog",
  search: {
    primary: {
      hint: "Primary search term is required", 
      example: "i.e., Undergraduate, Students, etc. (Press Enter to add the search term)",
    },
    secondary: {
      hint: "Secondary search term",
      example: "i.e., Transparency, GenAI guide, training, etc. (Press Enter to add the search term)",
    },
    tertiary: {
      hint: "Tertiary search term",
      example: "i.e., Responsible Use, Academic Performance etc. (Press Enter to add the search term)",
    },
    advanced: "Required field: advanced case-insensitive boolean search string. Use 'AND', 'OR', 'NOT' operators to combine search terms, and quotations to search for exact phrases.",
    dateRange: "Search range including the start and end date (i.e., 2023-01-01 - 2024-01-01). NOTE: some search engines may not support specific date range search (e.g., DBLP, Scopus), we will search base on the year provided.",
    database: "Select the databases to search from: Click on the database name to toggle the selection; a filled checkbox indicates the database is selected. At least one must be selected.",
    databaseDescription: {
      DBLP: "DBLP Search is \"mainly based on a publication's title string, as well as some info from the metadata (e.g., the venue title).\" Read more at https://dblp.org/faq/How+to+perform+a+search+within+the+full-texts.html",
      SEMANTIC_SCHOLAR: "Semantic Scholar Search uses Semantic Scholar's default \"custom-trained ranker to perform keyword searches\". Read more at https://medium.com/ai2-blog/building-a-better-search-engine-for-semantic-scholar-ea23a0b661e7",
      WEB_OF_SCIENCE: "Web of Science Search uses Web of Science Advanced Search Field TS (Topic), \"which searches for topic terms in the following fields within a record: Title, Abstract, Author, Keywords, Keywords Plus®\". Read more at https://images.webofknowledge.com/images/help/WOS/hs_advanced_fieldtags.html",
      IEEE_XPLORE: "DISABLED! Waiting for IEEE API Key... IEEE Xplore Search \"looks for a keyword in all fields (metadata)\". Read more at https://ieeexplore.ieee.org/Xplorehelp/searching-ieee-xplore/command-search",
      SCOPUS: "Scopus Search \"search in the Article title, Abstract and Keywords of documents\". Read more at https://elsevier.libguides.com/Scopus/topical-search"
    },
    validationPapers: {
      hint: "Enter the DOI of the validation papers to validate if the search configurations result in the validation papers.",
      example: "10.1109/ACCESS.2021.3053725, 10.1109/ACCESS.2021.3053726"
    },
    clearButton: "Resets and clears all search parameters and results",
    llmQuestions: "Enter the questions to filter the papers. At least one question is required. Answers should be comma-separated categorical answers.",
    llmQuestion: {
      add: "Add a question",
      remove: "Remove a question"
    },
    history: "Enable diff mode to compare two search histories. Click on the search history to choose the search history to compare.",
  },
  results: {
    toggleFullScreen: {
      enter: "Click to enter fullscreen",
      exit: "Click to exit fullscreen"
    },
    filterBar: "Filter the search results",
    manualAdd: "Manually add a paper to the search results",
    manualAddCsv: "Drag a CSV file here with DOIs to manually add papers",
    selectAll: "Select all papers in the search results",
    deselectAll: "Deselect all papers in the search results",
    hideMetadata: "Hide metadata for the selected papers",
    populateMetadata: "Populate metadata for the selected papers. Only applicable to papers with DOI",
    forwardSearch: "Search for papers that the selected papers cite",
    backwardSearch: "Search for papers that cite the selected papers",
    export: {
      enabled: "Export selected papers in CSV/BibTex/RIS format",
      disabled: "Select at least one paper to enable export"
    },
    operations: { 
      enabled: "Operations on resulting papers",
      disabled: "Select at least one paper to enable operations"
    }
  }
}