import AddIcon from '@mui/icons-material/Add';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import InfoIcon from '@mui/icons-material/Info';
import MinusIcon from '@mui/icons-material/Remove';
import { Box, Chip, CircularProgress, IconButton, Modal, Tooltip } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import CsvImportField from './components/CsvImportField';
import DatabaseSelector from './components/DatabaseSelector';
import InputLabel from './components/InputLabel';
import PublicationTable from './components/PublicationTable';
import SearchAppBar from './components/SearchAppBar';
import SearchTermAutocomplete, { MultiLayerSearch } from './components/SearchTermAutocomplete';
import { Button } from './components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './components/ui/carousel';
import UsabilityGuide from './components/UsabilityGuide';
import { cn } from './lib/utils';
import './main.css';
import {
  LLMPaperFilterResponse,
  LLMQuestion,
  Publication,
  SearchEngineType,
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
    sources: [SearchEngineType.DBLP],
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
  const [showMetadata, setShowMetadata] = useState(false);
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

  const [fullscreenState, setFullscreenState] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchForm[]>([
    // {
    //   validation_papers: [],
    //   search_terms: {
    //     advanced: 'AI and "Machine Learning" and not Education',
    //     primary: [],
    //     secondary: [],
    //     tertiary: [],
    //   },
    //   year_start: 2023,
    //   year_end: 2024,
    //   sources: [SearchEngineType.DBLP],
    // },
    // {
    //   validation_papers: [],
    //   search_terms: {
    //     advanced: 'AI and "Machine Learning"',
    //     primary: [],
    //     secondary: [],
    //     tertiary: [],
    //   },
    //   year_start: 2023,
    //   year_end: 2024,
    //   sources: [SearchEngineType.DBLP],
    // },
  ]);
  const [currentSearchHistoryIndex, setCurrentSearchHistoryIndex] = useState(0);
  const [diffMode, setDiffMode] = useState(false);
  const [diffSearchHistoryIndex, setDiffSearchHistoryIndex] = useState<null | number>(null);
  const [diffSearchResults, setDiffSearchResults] = useState<SearchResult>({
    matches: {
      num_matches: 0,
      papers: [],
      percentage_match: 0
    },
    results: [],
    variations: []
  });
  // TODO: store a search reference id of the results it provides;
  // query endpoint when triggered to get the results of the search
    
  let numMatched = searchResults?.matches?.num_matches;
  let percentageMatched = searchResults?.matches?.percentage_match;
  
  const multiLayerSearchFields: MultiLayerSearch[] = ['primary', 'secondary', 'tertiary']; 

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
      manualAdd: "Manually add a paper to the search results",
      manualAddCsv: "Drag a CSV file here with DOIs to manually add papers",
      selectAll: "Select all papers in the search results",
      deselectAll: "Deselect all papers in the search results",
      hideMetadata: "Hide metadata for the selected papers",
      populateMetadata: "Populate metadata for the selected papers. Only applicable to papers with DOI",
      forwardSearch: "Search for papers that the selected papers cite",
      backwardSearch: "Search for papers that cite the selected papers",
      export: "Export selected papers in CSV/BibTex/RIS format",
    }
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
          showForwardSearch: true,
          showBackwardSearch: true,
          showDeleteMode: true,
          showPopulateMetadata: true,
          showHideMetadata: true,
        }))
        setSearchHistory([...searchHistory, { id: res.data.id, ...searchForm}]);
        setCurrentSearchHistoryIndex(searchHistory.length);
      })
      .catch((error) => toast.error('Error:', error.response.data))
      .finally(() => setIsSearching(false));
  }

  const handleAddPaper = async () => {
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
      sources: [SearchEngineType.DBLP],
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

  const handleFullScreen = () => {
    setFullscreenState(!fullscreenState);
    // get id = publication-data, add container class to it
    const publicationData = document.getElementById('publication-data');
    const publicationDataInner = document.getElementById('publication-data-inner');
    if (publicationData) {
      publicationData.classList.toggle('container');
      publicationDataInner?.classList.toggle('container');
    }
  }
  
  const handleSearchHistory = (offset: number) => {
    setCurrentSearchHistoryIndex((prevIndex) => {
      let newIndex = prevIndex + offset;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= searchHistory.length) newIndex = searchHistory.length - 1;
      return newIndex;
    });
    // setSearchForm(searchHistory[index]);
  }

  const handleDiffMode = () => {
    if (diffMode) {
      setDiffSearchHistoryIndex(null);
      // find main-data-table and remove col-6 class from it
    } else {
      // TODO: Implement diff mode functionality
      // ========================================================================
      // 1. Query all search results for the diff search history (given index)
      // 2. Compare the two search results:
      //    - Common papers: no change in background color
      //    - Papers only in the first search: green background
      //    - Papers only in the second search: red background
    }
    const publicationData = document.getElementsByClassName('main-data-table')[0];
      if (publicationData) {
        publicationData.classList.toggle('col-6');
      }
    setDiffMode(!diffMode);
  }

  const handleChooseSearchHistory = async (index: number) => {
    if (!diffMode) {
      setCurrentSearchHistoryIndex(index);
      await axios.get(`${BASE_URL}/scraper/historical-search`, {
        params: { id: searchHistory[index].id }
      })
      .then((res) => {
        setSearchResults(res.data);
        setButtonState((prevState) => ({
          ...prevState,
          showSelectAll: true,
          showDeselectAll: true,
          showForwardSearch: false,
          showBackwardSearch: false,
          showDeleteMode: true,
          showPopulateMetadata: true,
          showHideMetadata: true,
          showExport: true,
        }))
      })
      .catch((error) => {
        console.log(error);
        toast.error('Error:', error)
      })

    } else {
      if (currentSearchHistoryIndex === index) {
        toast.info('Cannot choose the same search history to compare');
        return;
      }
      await axios.get(`${BASE_URL}/scraper/historical-search`, {
        params: { id: searchHistory[index].id }
      })
      .then((res) => { 
        setDiffSearchResults(res.data);
      })
      .catch((error) => {
        console.log(error);
        toast.error('Error:', error)
      })
      .finally(() => setDiffSearchHistoryIndex(index));
    }
  }

  const handleAdvancedChipClick = (keyword: string, synonym: string) => {
    
    // Check if keyword is a phrase, 
    // if it is, surround with " "
    toast.info(`Replacing ${keyword} with ${synonym}`);
    if (keyword.split(' ').length > 1) {
      keyword = `"${keyword}"`;
    }
    // do the same for syonnym
    if (synonym.split(' ').length > 1) {
      synonym = `"${synonym}"`;
    }


    let replacement = `(${keyword} or ${synonym})`;
    setSearchForm({
      ...searchForm,
      search_terms: {
        ...searchForm.search_terms,
        advanced: searchForm.search_terms.advanced.replace(keyword, replacement),
      }
    })
  }

  return (
      <div className="mt-3">
        <div className="container">
          <h1 className="text-4xl font-medium">ARC: Automated Review Companion</h1>
        
          {/* Search Bar */}
          <div className="p-3 mt-3 border rounded" id="search-bar">
            <div className="d-flex flex-row justify-content-between">
              <h3 className="text-3xl font-medium">Search Bar</h3>
              {/* Button to open up a modal for a usability guide */}
              <div className="d-flex gap-2">
                <Tooltip title={tooltipText.usabilityGuide}>
                  <Button className="bg-blue-500/80" onClick={() => setShowUsabilityGuide(true)}>
                    <InfoIcon/>
                  </Button>
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
                            key={field}
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
                    <>
                      <div className="input-group mb-3">
                        <InputLabel tooltip={tooltipText.search.advanced} label="Advanced Search" required/>
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
                      <div className="container">
                        {searchResults.variations.length > 0 && (
                          <div className="flex flex-row gap-2 flex-wrap my-3">
                            <span className="text-center">Variations:</span>
                              {searchResults.variations.map((variation) => (
                                <Tooltip title={
                                  <div className="d-flex flex-column gap-2">
                                    <span>Synonyms:</span>
                                    <Box className="word-variant-box mb-2">
                                      {variation.synonyms.map((synonym) => (
                                          <div
                                            key={synonym}
                                            onClick={() => handleAdvancedChipClick(variation.word, synonym)}
                                            className='word-variant-chip'
                                            style={{ color: "black", cursor: "pointer" }}
                                          >
                                            {synonym}
                                          </div>
                                      ))}
                                    </Box>
                                  </div>
                                }>
                                  <Chip
                                    key={variation.word}
                                    label={variation.word}
                                    className='p-0 m-0'
                                  />
                              </Tooltip>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Year Range */}
                  <div className="input-group mb-3">
                    <InputLabel tooltip={tooltipText.search.yearRange} label="Year Range" required/>
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
                    <InputLabel tooltip={tooltipText.search.database} label="Database Types" required/>
                    <DatabaseSelector searchForm={searchForm} setSearchForm={setSearchForm}/>                   
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
                            searchResults?.matches?.papers?.length > 0 && 
                            searchResults.matches.papers.map((match, index) => (
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
                    <Button onClick={handleSearch}>
                      {
                        isSearching
                        ? <div className="spinner-border text-light">
                            <span className="sr-only"></span>
                          </div>
                        : <span>Search</span>
                      }
                    </Button>
                    <Tooltip title={tooltipText.search.clearButton} placement="top">
                      <Button className="bg-slate-400 hover:bg-slate-500/80" onClick={resetSearchParameters}>Clear</Button>
                    </Tooltip>
                  </div>
                </div>)
            }
          </div>

          {/* LLM Questions */}
          {
              buttonState.showLLMQuestions && searchResults.results?.length > 0 &&
              <div className="container p-3 mt-3 border rounded" id="llm-questions">

                <div className="d-flex flex-row justify-content-between align-items-center">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <h3 className="text-3xl font-medium p-0 m-0">Paper Filter Questions (LLM-Powered)</h3>
                    <div>
                      <Tooltip title={tooltipText.search.llmQuestions} placement="top">
                        <InfoIcon color="info"/>
                      </Tooltip>
                    </div>
                  </div>
                  <div className='flex flex-row gap-2'>
                    <Tooltip title={tooltipText.search.llmQuestion.add} placement="top">
                      <IconButton onClick={handleAddLLMQuestion}>
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tooltipText.search.llmQuestion.remove} placement="top">
                      <IconButton onClick={handleRemoveLLMQuestion}>
                        <MinusIcon />
                      </IconButton>
                    </Tooltip>
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
        </div>

        {/* Search History */}
        {
          searchHistory.length > 0 &&
          <div className="container mt-3">
            <div className="container rounded border p-3" id="search-history">
              <div className="d-flex justify-content-between mb-3">
                <h3 className="text-3xl font-medium">Search History</h3>
                <Tooltip title={tooltipText.search.history} placement="top">
                  <Button className="bg-blue-500/80" onClick={handleDiffMode} disabled={searchHistory.length < 2}>Diff mode</Button>
                </Tooltip>
              </div>

              <div className="w-100 relative">
                {/* <button className="btn w-5" onClick={() => handleSearchHistory(-1)}>{"<"}</button> */}
                <div className="px-12 py-3">
                  <Carousel className="">
                    <CarouselContent>
                      {
                        searchHistory.map((search, index) => (
                          <CarouselItem 
                            key={search.year_start}
                            className="basis-1/3"
                            onClick={() => handleChooseSearchHistory(index)}
                          >
                            <Button 
                              className={
                                cn(
                                  "flex flex-col w-100 h-24 align-items-start bg-slate-50 text-black hover:bg-blue-200/80 border-slate-400 border-1",
                                  (index === currentSearchHistoryIndex ? "bg-blue-500/80 text-white hover:bg-blue-600/80" : "") + 
                                  (diffMode && diffSearchHistoryIndex === index ? "bg-green-700/80 text-white hover:bg-green-800/80" : "")
                                )
                              }
                            >
                              <span className="leading-[16px]">Search {index + 1} : {search.year_start} - {search.year_end}</span>
                              <span>Ref: {search.id ?? "-"}</span>
                              {
                                search.search_terms.advanced &&
                                <span className="mt-2 leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
                                  Advanced Search: {search.search_terms.advanced}
                                </span>
                              }
                              {
                                search.search_terms.primary.length > 0 &&
                                <span className="mt-2 leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
                                  Primary Search: {search.search_terms.primary.join(', ')}
                                </span>
                              }
                              {
                                search.search_terms.secondary.length > 0 &&
                                <span className="mt-2 leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
                                  Secondary Search: {search.search_terms.secondary.join(', ')}
                                </span>
                              }
                              {
                                search.search_terms.tertiary.length > 0 &&
                                <span className="mt-2 leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
                                  Tertiary Search: {search.search_terms.tertiary.join(', ')}
                                </span>
                              }
                            </Button>
                          </CarouselItem>
                        ))
                      }
                      {
                        searchHistory.length === 0 &&
                        <div className="flex justify-content-center w-100">
                          <div className="p-0 m-0 leading-[16px] text-muted">No search history</div>
                        </div>
                      }
                    </CarouselContent>
                    <CarouselPrevious onClick={() => handleSearchHistory(-1)} />
                    <CarouselNext onClick={() => handleSearchHistory(1)} />
                  </Carousel>
                </div>
                {/* <button className="btn w-5" onClick={() => handleSearchHistory(1)}>{">"}</button> */}
              </div>

            </div>
          </div>
        }
        
        {/* Publications Data */}
        <section className="container" id="publication-data">
          <div className="p-3 mt-3 border rounded container" id="publication-data-inner">
            <div className="d-flex align-items-end gap-2 justify-content-between">
              <h3 className="p-0 m-0 text-3xl font-medium">Search Results</h3>
              {/* Button to make fullscreen */}
              <Tooltip title={fullscreenState ? tooltipText.results.toggleFullScreen.enter : tooltipText.results.toggleFullScreen.exit} placement="top">
                <IconButton onClick={handleFullScreen}>
                  {fullscreenState ? <FullscreenExitIcon/> : <FullscreenIcon/>}
                </IconButton>
              </Tooltip>
            </div>
            <div>Total Publications: {searchResults.results.length}</div>
                
            <div className="d-flex flex-column justify-content-between items-align-end mb-3 gap-2">
              
              {/* add input and button to manually add papers  */}
              <div className="flex flex-row">
                <div className="flex flex-row"></div>
                  <InputLabel tooltip={tooltipText.results.manualAdd} label="Manual Add"/>
                  <input
                      type="text"
                      className="form-control"
                      placeholder="10.18653/v1/N18-3011"
                      value={manualAddPapers.join(',')}
                      onChange={(e) => setManualAddPapers(e.target.value.split(','))}
                  />
                  <Button onClick={handleAddPaper}>
                    { 
                      isManuallyAddingPaper ? 
                      <CircularProgress size={18} color="inherit" /> :
                      <span>Add</span>
                    } 
                  </Button>
                  <CsvImportField 
                    // handleAddPaper={setManualAddPapers} 
                    tooltip={tooltipText.results.manualAddCsv} 
                  />
              </div>

              <div className='flex flex-wrap gap-2'>
                {/* Select All */}
                {
                  buttonState.showSelectAll &&
                  <Tooltip title={tooltipText.results.selectAll} placement="top">
                    <Button className='bg-blue-500' onClick={handleSelectAll}>Select All</Button>
                  </Tooltip>
                }
                {
                  buttonState.showDeselectAll &&
                  <Tooltip title={tooltipText.results.deselectAll} placement="top">
                    <Button className="bg-blue-500" onClick={handleDeselectAll}>Deselect All</Button>
                  </Tooltip>
                }
                {/* Forward/BackwardSearch */}
                {
                  buttonState.showForwardSearch &&
                  <Tooltip title={tooltipText.results.forwardSearch} placement="top">
                    <Button className="" disabled={snowballingType != ""}
                            onClick={() => handleSnowballing("forward")}>
                      {
                        snowballingType === "forward"
                            ? <div className="spinner-border text-light">
                              <span className="sr-only"></span>
                            </div>
                            : <span>Forward Search</span>
                      }
                    </Button>
                  </Tooltip>
                }
                {
                  buttonState.showBackwardSearch &&
                  <Tooltip title={tooltipText.results.backwardSearch} placement="top">
                    <Button type="button" className="btn btn-primary" disabled={snowballingType != ""}
                            onClick={() => handleSnowballing("backward")}>
                      {
                        snowballingType === "backward"
                            ? <div className="spinner-border text-light">
                              <span className="sr-only"></span>
                            </div>
                            : <span>Backward Search</span>
                      }
                    </Button>
                  </Tooltip>
                }
                {/* Hide Metadata */}
                {
                  buttonState.showHideMetadata && (showMetadata
                    ? <Button className="bg-green-600 hover:bg-green-700" onClick={handleShowMetadata}>Hide Metadata</Button>
                    : <Button className="bg-green-600 hover:bg-green-700" onClick={handleShowMetadata}>Show Metadata</Button>)
                }

                {/* Popualte metadata */}
                {
                    buttonState.showPopulateMetadata &&
                    <Tooltip title={tooltipText.results.populateMetadata} placement="top">
                      <Button className="bg-green-600 hover:bg-green-700" onClick={populateMetadata}>
                        {
                          !isPopulatingMetadata
                              ? <span>Populate Metadata</span>
                              : <div className="spinner-border text-light">
                                <span className="sr-only"></span>
                              </div>
                        }
                      </Button>
                    </Tooltip>
                }
                {/* Toggle delete mode */}
                {
                  (buttonState.showDeleteMode || searchResults.results.length > 0) &&
                  <Button className="bg-red-600 hover:bg-red-700" onClick={() => setDeleteMode(!deleteMode)}>
                    {deleteMode ? 'Cancel' : 'Edit/Delete Mode'}
                  </Button>
                }
                {/* Export */}
                {
                  buttonState.showExport &&
                  <div className="dropdown d-flex">
                        <Tooltip title={tooltipText.results.export} placement="top">
                          <Button className="bg-slate-500 hover:bg-slate-600 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Export
                          </Button>
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
            <div className="search-results row" style={{ height: "80%" }}>
              {/* Main #1 */}
              <div id="publication-data-table" className='main-data-table h-[100%]'>
                  <PublicationTable
                    searchResults={searchResults}
                    setSearchResults={setSearchResults}
                    selectedPapers={selectedPapers}
                    handlePaperSelect={handlePaperSelect}
                    showMetadata={showMetadata}
                    llmQuestions={llmQuestions}
                    deleteMode={deleteMode}
                  />
              </div>
              {/* Diff #2 */}
              {
                diffMode && diffSearchHistoryIndex !== null &&
                <div id="publication-data-table" className="diff-data-table col-6 border h-100">
                  <PublicationTable searchResults={diffSearchResults} /> 
                </div> 
              }
              {
                diffMode && diffSearchHistoryIndex === null &&
                <div id="publication-data-table" className="diff-data-table col-6 border h-100">
                  <div className="flex justify-content-center align-items-center h-100">
                    <div className="text-muted">No chosen search to compare</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      </div>
  )
}

export default App
