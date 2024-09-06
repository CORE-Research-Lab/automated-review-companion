import InfoIcon from '@mui/icons-material/Info';
import { Modal, Tooltip } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import PublicationRow from './components/PublicationRow';
import SearchAppBar from './components/SearchAppBar';
import SearchTermAutocomplete, { MultiLayerSearch } from './components/SearchTermAutocomplete';
import UsabilityGuide from './components/UsabilityGuide';
import './main.css';
import {
  LLMPaperFilterResponse,
  LLMQuestion,
  Publication,
  SearchForm,
  SearchMode,
  SearchResult,
  SnowballingSearch
} from './types';

function App() {
  const BASE_URL = 'http://localhost:8000/api';
  const [showUsabilityGuide, setShowUsabilityGuide] = useState(false);
  const [searchForm, setSearchForm] = useState<SearchForm>({
    validation_papers: [],
    search_terms: {
      advanced: 'AI and "Machine Learning" and not Education',
      primary: [],
      secondary: [],
      tertiary: [],
    },
    year_start: 2023,
    year_end: 2024,
    sources: ["DBLP"],
  });
  const [searchResults, setSearchResults] = useState<SearchResult>({
    matches: {
      num_matches: 0,
      papers: [],
      percentage_match: 0
    },
    results: [],
    variations: []
  });
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [llmQuestions, setLLMQuestions] = useState<LLMQuestion[]>([{
    id: 1,
    question: '',
    answer: ''
  }]);
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.SIMPLE);
  const [expandedSearchBar, setExpandedSearchBar] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [manualAddPapers, setManualAddPapers] = useState<string[]>([]);
  const [isManuallyAddingPaper, setIsManuallyAddingPaper] = useState(false);
  const [isPopulatingMetadata, setIsPopulatingMetadata] = useState(false);
  const [snowballingType, setSnowballingType] = useState<string>('');
  const [useSimpleMode, setUseSimpleMode] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);

  const [buttonState, setButtonState] = useState({
    showSelectAll: false,
    showDeselectAll: false,
    showHideMetadata: false,
    showPopulateMetadata: false,
    showForwardSearch: false,
    showBackwardSearch: false,
    showExport: false,
    showLLMQuestions: false,
    showDeleteMode: false,
  })
    

  let isDBLPActive = searchForm.sources.includes("DBLP");
  let isSemanticScholarActive = searchForm.sources.includes("SEMANTIC_SCHOLAR");
  let isWebOfScienceActive = searchForm.sources.includes("WEB_OF_SCIENCE");
  let isIEEEActive = searchForm.sources.includes("IEEE_XPLORE");
  let isScopusActive = searchForm.sources.includes("SCOPUS");

  let numMatched = searchResults?.matches?.num_matches;
  let percentageMatched = searchResults?.matches?.percentage_match;

  const tooltipText = {
    usabilityGuide: "Click to view the usability guide",
    search: {
      primary: {
        hint: "Primary search term is required", 
        example: "i.e., AI, Deep Learning, etc.",
      },
      secondary: {
        hint: "Secondary search term",
        example: "i.e., Machine Learning, Generative AI, etc.",
      },
      tertiary: {
        hint: "Tertiary search term",
        example: "i.e., Deep Reinforcement Learning, Neural Networks, etc.",
      },
      advanced: "Required field: advanced case-insensitive boolean search string. Use 'AND', 'OR', 'NOT' operators to combine search terms, and quotations to search for exact phrases.",
      yearRange: "Year range including the start and end years (i.e., 2023 - 2024)",
      database: "Select the databases to search from: Click on the database name to toggle the selection; a filled checkbox indicates the database is selected. At least one must be selected.",
      validationPapers: "Enter the DOI of the validation papers to validate if the search configurations result in the validation papers.",
      clearButton: "Resets and clears all search parameters and results",
      llmQuestions: "Enter the questions to filter the papers. At least one question is required. Answers should be comma-separated categorical answers.",
    },
    results: {
      manualAdd: "Manually add a paper to the search results",
      selectAll: "Select all papers in the search results",
      deselectAll: "Deselect all papers in the search results",
      hideMetadata: "Hide metadata for the selected papers",
      populateMetadata: "Populate metadata for the selected papers. Only applicable to papers with DOI",
      forwardSearch: "Search for papers that the selected papers cite",
      backwardSearch: "Search for papers that cite the selected papers",
      export: "Export selected papers in CSV/BibTex/RIS format",
    }
  }

  const parseKeywordSuggestion = (keyword: string) => {
    // replace _ with space
    keyword = keyword.replace(/_/g, ' ');
    // capitalize first letter
    keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    return keyword;
  }

  // Return as a object with doi and title fields,
  // if the doi exists in the paper id, attribute it as doi, else attribute it as title
  const parseRootPapers = (papers: string[]) => {
    if (!papers || papers.length === 1 && !papers[0]) return [];
    return papers.map((paper) => {
      const doi = paper.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/ig)?.[0];
      return {
        doi: doi ?? '',
        title: doi ? '' : paper
      }
    })
  }

  const handleSearchFormChange = (e: React.SyntheticEvent, value: string[], field: MultiLayerSearch) => {
    setSearchForm({
      ...searchForm,
      search_terms: {
        ...searchForm.search_terms,
        [field]: value
      }
    })
  }

  const validateSearchForm = () => {
    if (!searchForm.search_terms.primary && searchMode === SearchMode.SIMPLE) {
      toast.error('Primary search term is required');
      return false;
    }
    // error if no database
    if (searchForm.sources.length === 0) {
      toast.error('At least one database must be selected');
      return false;
    }
    return true;
  }

  const handleSearch = async () => {
    if (!validateSearchForm() || isSearching) return;
    setIsSearching(true);
    toast.info('Searching...');
    const payload = {
      ...searchForm,
      search_terms: {
        advanced: searchMode === SearchMode.ADVANCED ? searchForm.search_terms.advanced : "",
        primary: searchMode === SearchMode.SIMPLE ? searchForm.search_terms.primary : [],
        secondary: searchMode === SearchMode.SIMPLE ? searchForm.search_terms.secondary : [],
        tertiary: searchMode === SearchMode.SIMPLE ? searchForm.search_terms.tertiary : []
      },
      validation_papers: parseRootPapers(searchForm.validation_papers)
    }

    await axios.post(`${BASE_URL}/scraper/search-and-clean`, payload)
      .then((res) => {
        setSearchResults(res.data)
        setButtonState((prevState) => ({
          ...prevState,
          showSelectAll: true,
          showDeselectAll: true,
          showPopulateMetadata: true,
          showDeleteMode: true,
        }))
      })
      .catch((error) => toast.error('Error:', error.response.data))
      .finally(() => setIsSearching(false));
  }

  const handleAddPaper = async () => {
    // if (isManuallyAddingPaper) return;
    setIsManuallyAddingPaper(true);
    toast.info('Adding papers...');
    await axios.post(`${BASE_URL}/scraper/manual-add-publication`, {
      dois: manualAddPapers
    })
    .then((res) => {
      // Do not add if paper is already in 
      const updatedResults = searchResults.results.filter((result: Publication) => !res.data.publications.find((paper: Publication) => paper.paper_id === result.paper_id));
      setSearchResults({...searchResults, results: [...updatedResults, ...res.data.publications]})
      toast.success('Papers added successfully');
    })
    .catch((error) => toast.error('Error:', error))
    .finally(() => setIsManuallyAddingPaper(false));
  }

  const populateMetadata = async () => {
    setIsPopulatingMetadata(true);
    await axios.post(`${BASE_URL}/scraper/publication-metadata`, {
      paper_ids: selectedPapers
    })
      .then((res) => {
        const data = res.data;
        const updatedResults = searchResults.results.map((result: Publication) => {
          const metadata = data.metadata.find((metadata: Publication) => metadata.paper_id === result.paper_id);
          return {
            ...result,
            ...metadata
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
        setButtonState((prevState) => ({
          ...prevState,
          showLLMQuestions: true,
          showForwardSearch: true,
          showBackwardSearch: true,
          showExport: true,
        }))
        toast.success('Metadata populated successfully');
      })
      .catch((error) => {
        console.log(error);
        toast.error('Error:', error)
      })
      .finally(() => setIsPopulatingMetadata(false));
  }

  const handleSelectAll = () => {
    setSelectedPapers(searchResults.results.map((result: Publication) => result.paper_id))
  }

  const handleDeselectAll = () => {
    setSelectedPapers([])
  }

  const handleExport = (format: string) => async () => {
    await axios.post(`${BASE_URL}/scraper/export`, {
      paper_ids: selectedPapers,
      format
    })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = res.headers['content-disposition'];
        const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => toast.error('Error:', error));
  }

  const handlePaperSelect = (paper_id: string) => {
    if (selectedPapers.includes(paper_id)) {
      setSelectedPapers(selectedPapers.filter((id) => id !== paper_id))
    } else {
      setSelectedPapers([...selectedPapers, paper_id])
    }
  }

  const matchDOIs = (originalDOI: string, toMatchDoi: string) => {
    return originalDOI.toLowerCase().includes(toMatchDoi.toLowerCase())
  }

  const handleSnowballing = async (searchType: string) => {
    if (snowballingType) return;
    setSnowballingType(searchType);
    await axios.post(`${BASE_URL}/publication/snowballing`, {
      publication_ids: selectedPapers,
      search_type: searchType,
      show_metadata: true
    })
    .then((res) => {
      let _searchType = searchType.charAt(0).toUpperCase() + searchType.slice(1);
      toast.info(`${_searchType} snowballing search completed`);
      
      if (searchType === "forward") {
        let updatedResults = [...searchResults.results];
        res.data.results.forEach((result: SnowballingSearch) => {
          const index = updatedResults.findIndex((r) => matchDOIs(r.paper_id, result.paper_id));
          if (index !== -1) {
            updatedResults[index].references = result.references;
            updatedResults[index].showReferences = true;
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
      } 
      else if (searchType === "backward") {
        let updatedResults = [...searchResults.results];
        res.data.results.forEach((result: SnowballingSearch) => {
          const index = updatedResults.findIndex((r) => matchDOIs(r.paper_id, result.paper_id));
          if (index !== -1) {
            updatedResults[index].citations = result.citations;
            updatedResults[index].showCitations = true;
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
      }
    })
    .catch((error) => {
      console.log(error);
      toast.error('Error:', error.response.data.error)
    })
    .finally(() => setSnowballingType(''));
  }

  const handleLLMFiltering = async () => {
    await axios.post(`${BASE_URL}/publication/llm-filter`, {
      questions: llmQuestions,
      paper_ids: selectedPapers
    })
    .then((res) => {
      let data = res.data.results
      const updatedResults = searchResults.results.map((result: Publication) => {
        const llm_responses = data.find((response: LLMPaperFilterResponse) => response.paper_id === result.paper_id)?.response;
        return {
          ...result,
          llm_responses
        }
      });
      setSearchResults({...searchResults, results: updatedResults})
    })
    .catch((error) => {
      console.log(error);
      toast.error('Error:', error)
    });
  }
  
  const handleAddLLMQuestion = () => {
    setLLMQuestions([...llmQuestions, {
      id: llmQuestions.length + 1,
      question: '',
      answer: ''
    }])
  }

  const handleShowMetadata = () => {
    setShowMetadata(!showMetadata)
  }

  const handleRemoveLLMQuestion = () => {
    if (llmQuestions.length === 1) {
      toast.info('At least one question is required');
      return;
    }
    setLLMQuestions(llmQuestions.slice(0, llmQuestions.length - 1))
  }



  const handleSelectSearchMode = (mode: SearchMode) => {
    setSearchMode(mode);
  }

  const resetSearchParameters = () => {
    setSearchForm({
      validation_papers: [],
      search_terms: {
        advanced: '',
        primary: [],
        secondary: [],
        tertiary: [],
      },
      year_start: 2023,
      year_end: 2024,
      sources: ["DBLP"],
    });
    setSearchResults({
      matches: {
        num_matches: 0,
        papers: [],
        percentage_match: 0
      },
      results: [],
      variations: []
    });
    setSelectedPapers([]);
    setLLMQuestions([{
      id: 1,
      question: '',
      answer: ''
    }]);
    setButtonState({
      showSelectAll: false,
      showDeselectAll: false,
      showHideMetadata: false,
      showPopulateMetadata: false,
      showForwardSearch: false,
      showBackwardSearch: false,
      showExport: false,
      showLLMQuestions: false,
      showDeleteMode: false,
    })
  }

  const handleSimpleMode = () => {
    let mode = !useSimpleMode ? 'Simple' : 'Advanced';
    toast.success(`${mode} mode enabled!`);
    setUseSimpleMode(!useSimpleMode);
  }

  const handleChipClick = (keyword: string, field: MultiLayerSearch) => {
    setSearchForm({
      ...searchForm,
      search_terms: {
        ...searchForm.search_terms,
        [field]: [
          ...searchForm.search_terms[field],
          keyword
        ]
      }
    })
  }

  const multiLayerSearchFields: MultiLayerSearch[] = ['primary', 'secondary', 'tertiary']; 

  return (
      <div className="container mt-3">
        <h1>ARC: Automated Review Companion</h1>

        {/* Search Bar */}
        <div className="container p-3 mt-3 border rounded" id="search-bar">

          <div className="d-flex flex-row justify-content-between">
            <h3>Search Bar</h3>
            {/* Button to open up a modal for a usability guide */}
            <div className="d-flex gap-2">
              <button className="btn btn-secondary" onClick={handleSimpleMode}>
                {!useSimpleMode ? 'Enable Simple Mode' : 'Enable Advanced Mode'}
              </button>
              <Tooltip title={tooltipText.usabilityGuide}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUsabilityGuide(true)}>
                  <InfoIcon/>
                </button>
              </Tooltip>
              {/* MUI Modal for usability guide */}
              <Modal open={showUsabilityGuide} onClose={() => setShowUsabilityGuide(false)}>
                <UsabilityGuide handleClose={() => setShowUsabilityGuide(false)}/>
              </Modal>
            </div>
          </div>

          <SearchAppBar searchMode={searchMode} handleSelectSearchMode={handleSelectSearchMode} />

          <div className="divider border-bottom"></div>
          {/* Multi-layer Keyword Search */}
          {expandedSearchBar && (
              <div className="mt-3">

                {searchMode === SearchMode.SIMPLE && (
                    <div className="input-group mb-3 d-flex flex-column">
                      {multiLayerSearchFields.map((field) => (
                        <SearchTermAutocomplete
                          field={field}
                          searchForm={searchForm}
                          searchResults={searchResults}
                          setSearchResults={setSearchResults}
                          tooltipText={tooltipText}
                          handleSearchFormChange={handleSearchFormChange}
                          handleChipClick={handleChipClick}
                      />))}
                    </div>
                )}

                {searchMode === SearchMode.ADVANCED && (
                    <div className="input-group mb-3">
                      <Tooltip title={tooltipText.search.advanced} placement="right">
                        <div className="input-group-prepend">
                    <span className="input-group-text rounded-0">
                      Advanced Search <span className='text-red'>*</span>
                    </span>
                        </div>
                      </Tooltip>
                      <input
                          type="text"
                          className="form-control"
                          placeholder="AI and ('Machine Learning' or 'Generative AI') and not Education"
                          value={searchForm.search_terms.advanced}
                          onChange={(e) => setSearchForm({
                            ...searchForm,
                            search_terms: {...searchForm.search_terms, advanced: e.target.value}
                          })}
                      />
                    </div>
                )}

                {/* Year Range */}
                <div className="input-group mb-3">
                  <Tooltip title={tooltipText.search.yearRange} placement="right">
                    <div className="input-group-prepend">
                      <div className="input-group-text rounded-0" id="basic-addon1">
                        <span>Year Range</span>
                        <span className="text-red">*</span>
                      </div>
                    </div>
                  </Tooltip>
                  <input
                      type="number"
                      className="form-control"
                      placeholder="Start Year"
                      value={searchForm.year_start}
                      onChange={(e) => setSearchForm({...searchForm, year_start: parseInt(e.target.value)})}
                  />
                  <input
                      type="number"
                      className="form-control"
                      placeholder="End Year"
                      value={searchForm.year_end}
                      onChange={(e) => setSearchForm({...searchForm, year_end: parseInt(e.target.value)})}
                  />
                </div>


                {/*  Database Types */}
                <div className="d-flex flex-row w-100 mb-3">
                  <Tooltip title={tooltipText.search.database}>
                    <div className="input-group-prepend">
                      <div className="input-group-text rounded-0" id="basic-addon1">
                        <span>Database</span>
                        <span className="text-red">*</span>
                      </div>
                    </div>
                  </Tooltip>
                  <div className="btn-group">
                    <input
                        type="checkbox"
                        className="btn-check"
                        id="btncheck1"
                        autoComplete="off"
                        checked={isDBLPActive}
                        onChange={() => {
                          setSearchForm({
                            ...searchForm,
                            sources: searchForm.sources.find((source) => source === "DBLP")
                                ? searchForm.sources.filter((source) => source !== "DBLP")
                                : [...searchForm.sources, "DBLP"]
                          })
                        }}
                    />
                    <label className="btn btn-outline-secondary" htmlFor="btncheck1">DBLP</label>

                    <input
                        type="checkbox"
                        className="btn-check"
                        id="btncheck2"
                        autoComplete="off"
                        checked={isSemanticScholarActive}
                        onClick={() => {
                          setSearchForm({
                            ...searchForm,
                            sources: searchForm.sources.find((source) => source === "SEMANTIC_SCHOLAR")
                                ? searchForm.sources.filter((source) => source !== "SEMANTIC_SCHOLAR")
                                : [...searchForm.sources, "SEMANTIC_SCHOLAR"]
                          })
                        }}
                    />
                    <label className="btn btn-outline-secondary" htmlFor="btncheck2">Semantic Scholar</label>

                    <input
                        type="checkbox"
                        className="btn-check"
                        id="btncheck3"
                        autoComplete="off"
                        checked={isWebOfScienceActive}
                        onClick={() => {
                          setSearchForm({
                            ...searchForm,
                            sources: searchForm.sources.find((source) => source === "WEB_OF_SCIENCE")
                                ? searchForm.sources.filter((source) => source !== "WEB_OF_SCIENCE")
                                : [...searchForm.sources, "WEB_OF_SCIENCE"]
                          })
                        }}
                    />
                    <label className="btn btn-outline-secondary" htmlFor="btncheck3">Web of Science</label>

                    <input
                        type="checkbox"
                        className="btn-check"
                        id="btncheck4"
                        autoComplete="off"
                        checked={isIEEEActive}
                        onClick={() => {
                          setSearchForm({
                            ...searchForm,
                            sources: searchForm.sources.find((source) => source === "IEEE_XPLORE")
                                ? searchForm.sources.filter((source) => source !== "IEEE_XPLORE")
                                : [...searchForm.sources, "IEEE_XPLORE"]
                          })
                        }}
                    />
                    <label className="btn btn-outline-secondary" htmlFor="btncheck4">IEEE Xplore</label>

                    <input
                        type="checkbox"
                        className="btn-check"
                        id="btncheck5"
                        autoComplete="off"
                        checked={isScopusActive}
                        onClick={() => {
                          setSearchForm({
                            ...searchForm,
                            sources: searchForm.sources.find((source) => source === "SCOPUS")
                                ? searchForm.sources.filter((source) => source !== "SCOPUS")
                                : [...searchForm.sources, "SCOPUS"]
                          })
                        }}
                    />
                    <label className="btn btn-outline-secondary" htmlFor="btncheck5">Scopus</label>

                  </div>
                </div>

                {/* Validation Papers */}
                <div className="d-flex flex-row w-100">
                  <Tooltip title={tooltipText.search.validationPapers} placement='right'>
                    <div className="input-group-prepend">
                      <span className="input-group-text rounded-0" id="basic-addon1">Validation Papers</span>
                    </div>
                  </Tooltip>
                  <input
                      type="text"
                      className="form-control"
                      placeholder="10.1109/ACCESS.2021.3053725, 10.1109/ACCESS.2021.3053726"
                      value={searchForm.validation_papers.join(',')}
                      onChange={(e) => setSearchForm({...searchForm, validation_papers: e.target.value.split(',')})}
                  />
                </div>

                {/* Root Paper matches */}
                {
                    searchForm.validation_papers.length > 0 &&
                    <div className="d-flex flex-column w-100 mt-3">
                      <div className="d-flex flex-row align-items-center gap-2 w-100">
                        <span>Result:</span>
                        <progress className='w-75' value={percentageMatched} max="100"/>
                        <span> {numMatched}/{searchForm.validation_papers.length} ({percentageMatched}%) matches</span>
                      </div>
                      <div className="table-responsive mt-3">
                        <table className="table table-striped">
                          <thead className='bg-primary text-white'>
                          <tr>
                            <td>#</td>
                            <td>DOI/Paper Title</td>
                          </tr>
                          </thead>
                          <tbody>
                          {/* Show the percentage matched with a progress bar (bootstrap), the total number of matches, and all the matches in tiny rows */}
                          {
                              searchResults?.matches?.papers?.length > 0 && searchResults.matches.papers.map((match, index) => (
                                  <tr key={match.doi}>
                                    <td>{index + 1}</td>
                                    <p>{match.doi || match.title}</p>
                                  </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                }


                {/* Buttons */}
                <div className="d-flex flex-row justify-content-end mt-3 gap-2">
                  <button type="button" className="btn btn-primary" onClick={handleSearch}>
                    {
                      isSearching
                          ? <div className="spinner-border text-light">
                            <span className="sr-only"></span>
                          </div>
                          : <span>Search</span>
                    }
                  </button>
                  <Tooltip title={tooltipText.search.clearButton} placement="top">
                    <button type="button" className="btn btn-secondary ml-2" onClick={resetSearchParameters}>Clear
                    </button>
                  </Tooltip>
                </div>
              </div>)
          }
        </div>

        {/* LLM Questions */}
        {
            !useSimpleMode && buttonState.showLLMQuestions && searchResults.results?.length > 0 &&
            <div className="container p-3 mt-3 border rounded" id="llm-questions">

              <div className="d-flex flex-row justify-content-between align-items-center">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <h3 className="p-0 m-0">Paper Filter Questions (LLM-Powered)</h3>
                  <div>
                    <Tooltip title={tooltipText.search.llmQuestions} placement="top">
                      <InfoIcon color="info"/>
                    </Tooltip>
                  </div>
                </div>
                <div className='d-flex flex-row gap-2'>
                  <button className="btn btn-primary" onClick={handleAddLLMQuestion}>Add Question</button>
                  <button className="btn btn-secondary" onClick={handleRemoveLLMQuestion}>Remove a Question</button>
                </div>
              </div>
              <div className="max-height-30vh overflow-y-scroll">
                {
                    llmQuestions && llmQuestions.length > 0 && llmQuestions.map((question, index) => (
                        <div key={question.id} className="d-flex flex-row gap-2 mt-3">
                          <div className="d-flex align-items-center justify-content-center w-5">{index + 1}</div>
                          <input className="form-control" placeholder="Question" value={question.question} onChange={
                            (e) => {
                              const updatedQuestions = llmQuestions.map((q) => {
                                if (q.id === question.id) return {...q, question: e.target.value}
                                return q;
                              })
                              setLLMQuestions(updatedQuestions);
                            }
                          }/>
                          <input className="form-control" placeholder="Answer" value={question.answer} onChange={
                            (e) => {
                              const updatedQuestions = llmQuestions.map((q) => {
                                if (q.id === question.id) return {...q, answer: e.target.value}
                                return q;
                              })
                              setLLMQuestions(updatedQuestions);
                            }
                          }/>
                        </div>
                    ))
                }
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-success" onClick={handleLLMFiltering}>Submit Questions</button>
              </div>
            </div>
        }

        {/* Publications Data */}
        <section className="container p-3 mt-3 border rounded" id="publication-data">
          {/* Actions */}
          <div className="d-flex align-items-end gap-2">
            <h3 className="p-0 m-0">Search Results</h3>
          </div>
              
          <div className="d-flex justify-content-between items-align-end mb-3">
            <div className="d-flex justify-content-center flex-column w-50">
              <div>Total Publications: {searchResults.results.length}</div>
              {/* add input and button to manually add papers  */}
              <div className="d-flex flex-row">
                  <Tooltip title={tooltipText.results.manualAdd} placement='right'>
                    <div className="input-group-prepend">
                      <span className="input-group-text rounded-0" id="basic-addon1">
                        Manual Add
                      </span>
                    </div>
                  </Tooltip>
                  <input
                      type="text"
                      className="form-control"
                      placeholder="10.18653/v1/N18-3011"
                      value={manualAddPapers.join(',')}
                      onChange={(e) => setManualAddPapers(e.target.value.split(','))}
                  />
                  <button className="btn btn-primary" onClick={handleAddPaper}>
                    { 
                      isManuallyAddingPaper ? 
                      <div className="spinner-border text-light">
                        <span className="sr-only"></span>
                      </div> :
                      <span>Add</span>
                    } 
                  </button>
                </div>
            </div>
            <div className='d-flex gap-2'>
              {/* Select All */}
              {
                  buttonState.showSelectAll &&
                  <Tooltip title={tooltipText.results.selectAll} placement="top">
                    <button type="button" className="btn btn-primary" onClick={handleSelectAll}>Select All</button>
                  </Tooltip>
              }
              {
                  buttonState.showDeselectAll &&
                  <Tooltip title={tooltipText.results.deselectAll} placement="top">
                    <button type="button" className="btn btn-secondary" onClick={handleDeselectAll}>Deselect All
                    </button>
                  </Tooltip>
              }
              {/* Hide Metadata */}
              {
                  buttonState.showHideMetadata && (showMetadata
                      ?
                      <button type="button" className="btn btn-warning" onClick={handleShowMetadata}>Hide Metadata</button>
                      :
                      <button type="button" className="btn btn-primary" onClick={handleShowMetadata}>Show Metadata</button>)
              }

              {/* Popualte metadata */}
              {
                  buttonState.showPopulateMetadata &&
                  <Tooltip title={tooltipText.results.populateMetadata} placement="top">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={populateMetadata}
                    >
                      {
                        !isPopulatingMetadata
                            ? <span>Populate Metadata</span>
                            : <div className="spinner-border text-light">
                              <span className="sr-only"></span>
                            </div>
                      }
                    </button>
                  </Tooltip>
              }
              {/* Toggle delete mode */}
              {
                (buttonState.showDeleteMode || searchResults.results.length > 0) &&
                <button type="button" className="btn btn-danger" onClick={() => setDeleteMode(!deleteMode)}>
                  {deleteMode ? 'Cancel' : 'Edit/Delete Mode'}
                </button>
              }
              {/* Forward/BackwardSearch */}
              {
                  !useSimpleMode &&
                  buttonState.showForwardSearch &&
                  <Tooltip title={tooltipText.results.forwardSearch} placement="top">
                    <button type="button" className="btn btn-primary" disabled={snowballingType != ""}
                            onClick={() => handleSnowballing("forward")}>
                      {
                        snowballingType === "forward"
                            ? <div className="spinner-border text-light">
                              <span className="sr-only"></span>
                            </div>
                            : <span>Forward Search</span>
                      }
                    </button>
                  </Tooltip>
              }
              {
                  !useSimpleMode &&
                  buttonState.showBackwardSearch &&
                  <Tooltip title={tooltipText.results.backwardSearch} placement="top">
                    <button type="button" className="btn btn-primary" disabled={snowballingType != ""}
                            onClick={() => handleSnowballing("backward")}>
                      {
                        snowballingType === "backward"
                            ? <div className="spinner-border text-light">
                              <span className="sr-only"></span>
                            </div>
                            : <span>Backward Search</span>
                      }
                    </button>
                  </Tooltip>
              }

              {/* Export */}
              {
                buttonState.showExport &&
                <div className="dropdown">
                      <Tooltip title={tooltipText.results.export} placement="top">
                        <button className="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                aria-expanded="false">
                          Export
                        </button>
                      </Tooltip>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={handleExport("CSV")}>CSV</button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleExport("BIBTEX")}>Bibtex</button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleExport("RIS")}>RIS</button>
                    </li>
                  </ul>
                </div>
              }
            </div>
          </div>

          {/* Table data */}
          <div id="publication-data-table">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead className='bg-primary text-white ' style={{ height: "20px"}}>
                <td style={{ minWidth: "10px" }}></td>
                <td style={{ minWidth: "50px" }}>#</td>
                <td style={{ minWidth: "250px" }}>Paper ID</td>
                <td style={{ minWidth: "250px" }}>Title</td>
                <td>Source</td>
                <td style={{ minWidth: "250px" }}>Search String</td>
                <td style={{ minWidth: "250px" }}>Formatted Search String</td>
                <td>Status</td>

                {/* Metadata */}
                {
                    showMetadata &&
                    <>
                      <td style={{
                        minWidth: "350px",
                        maxHeight: "50px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>Abstract
                      </td>
                      <td style={{ minWidth: "220px" }}>Authors</td>
                      <td>Citations Count</td>
                      <td style={{ minWidth: "200px"}}>Conference/Journal</td>
                      <td>DOI</td>
                      <td>DOI URL</td>
                      <td>Keywords</td>
                      <td style={{ minWidth: "115px" }}>Publication Date</td>
                      <td>Publication Type</td>
                      <td>Publisher</td>
                      <td>Semantic Scholar URL</td>
                    </>
                }

                {/* Questions */}
                {
                    searchResults.results && searchResults.results.length > 0 &&
                    searchResults.results[0].llm_responses && searchResults.results[0].llm_responses.length > 0 &&
                    llmQuestions && llmQuestions.length > 0 && llmQuestions.map((response: LLMQuestion, index) => (
                        <td key={response.id} style={{minWidth: "220px"}}>Q{index + 1} {response.question}</td>
                    ))
                }
                </thead>
                <tbody>
                {searchResults?.results && searchResults.results.length > 0 && searchResults.results.map((result, rowIdx) => {

                  let publicationRows = [];

                  publicationRows.push(
                      <PublicationRow
                          rowType='main'
                          rowIdx={rowIdx}
                          deleteMode={deleteMode}
                          publication={result}
                          handlePaperSelect={handlePaperSelect}
                          selectedPapers={selectedPapers}
                          showMetadata={showMetadata}
                          searchResults={searchResults}
                          llmQuestions={llmQuestions}
                          setSearchResults={setSearchResults}
                      />
                  )

                  if (result.showReferences && result.references !== undefined && result.references?.length > 0) {
                    result.references.forEach((reference, referenceIdx) => {
                      publicationRows.push(
                          <PublicationRow
                              rowType="reference"
                              rowIdx={rowIdx + "-R" + referenceIdx}
                              deleteMode={deleteMode}
                              publication={reference}
                              handlePaperSelect={handlePaperSelect}
                              selectedPapers={selectedPapers}
                              showMetadata={showMetadata}
                              searchResults={searchResults}
                              llmQuestions={llmQuestions}
                              setSearchResults={setSearchResults}
                          />
                      )
                    })
                  }


                  if (result.showCitations && result.citations !== undefined && result.citations?.length > 0) {
                    result.citations.forEach((citation) => {
                      publicationRows.push(
                          <PublicationRow
                              rowType="citation"
                              rowIdx={rowIdx + "-C" + citation.paper_id}
                              deleteMode={deleteMode}
                              publication={citation}
                              handlePaperSelect={handlePaperSelect}
                              selectedPapers={selectedPapers}
                              showMetadata={showMetadata}
                              searchResults={searchResults}
                              llmQuestions={llmQuestions}
                              setSearchResults={setSearchResults}
                          />
                      )
                    })
                  }
                  return publicationRows;
                })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
  )
}

export default App
