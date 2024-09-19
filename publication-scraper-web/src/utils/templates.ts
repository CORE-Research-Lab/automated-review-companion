import { SearchEngineType } from "@/types";

export const defaultSearchForm = {
  validation_papers: [],
  search_terms: {
    advanced: '',
    primary: [],
    secondary: [],
    tertiary: [],
  },
  year_start: 2023,
  year_end: 2024,
  sources: [SearchEngineType.DBLP],
}

export const defaultSearchResult = {
  matches: {
    num_matches: 0,
    papers: [],
    percentage_match: 0
  },
  results: [],
  variations: []
}

export const defaultLLMQuestions = [{
  id: 1,
  question: '',
  answer: '',
  rationale: ''
}]

export const defaultLLMOptions = {
  includeExamples: false,
  includeRationale: false,
}

export const defaultButtonState = {
  showSelectAll: false,
  showDeselectAll: false,
  showHideMetadata: false,
  showPopulateMetadata: false,
  showForwardSearch: false,
  showBackwardSearch: false,
  showExport: false,
  showLLMQuestions: false,
}

export const defaultDiffSearchResults = {
  matches: {
    num_matches: 0,
    papers: [],
    percentage_match: 0
  },
  results: [],
  variations: []
}