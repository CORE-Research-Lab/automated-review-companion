import AddIcon from '@mui/icons-material/Add';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import InfoIcon from '@mui/icons-material/Info';
import MinusIcon from '@mui/icons-material/Remove';
import { Box, Chip, CircularProgress, IconButton, Tooltip } from '@mui/material';
import axios from 'axios';
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { handleError } from './common/handler';
import ChangelogModal from './components/ChangelogModal';
import CsvImportField from './components/CsvImportField';
import DatabaseSelector from './components/DatabaseSelector';
import ExportDropdown from './components/ExportDropdown';
import InputLabel from './components/InputLabel';
import PaperOperations from './components/PaperOperations';
import PublicationTable from './components/PublicationTable';
import SearchAppBar from './components/SearchAppBar';
import SearchHistoryHeaderCard from './components/SearchHistoryHeaderCard';
import SearchTermAutocomplete, { MultiLayerSearch } from './components/SearchTermAutocomplete';
import Spinner from './components/Spinner';
import { Button } from './components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './components/ui/carousel';
import { Checkbox } from './components/ui/checkbox';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import UsabilityGuide from './components/UsabilityGuide';
import { tooltipText } from './data/tooltip';
import { cn } from './lib/utils';
import './main.css';
import {
  ButtonState,
  DiffType,
  LLMOptions,
  LLMPaperFilterResponse,
  LLMQuestion,
  LLMUserAnswer,
  Publication,
  SearchForm,
  SearchMode,
  SearchResult
} from './types';
import { BASE_URL, CURRENT_VERSION } from './utils/common';
import { defaultButtonState, defaultDiffSearchResults, defaultLLMOptions, defaultLLMQuestions, defaultSearchForm, defaultSearchResult } from './utils/templates';
import { validateSearchForm } from './utils/validators';

function App() {
  const [showUsabilityGuide, setShowUsabilityGuide] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [searchForm, setSearchForm] = useState<SearchForm>(defaultSearchForm);
  const [searchResults, setSearchResults] = useState<SearchResult>(defaultSearchResult);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  
  const [llmQuestions, setLLMQuestions] = useState<LLMQuestion[]>(defaultLLMQuestions);
  const [llmAnswers, setLLMAnswers] = useState<LLMUserAnswer[]>([]);
  const [llmOptions, setLLMOptions] = useState<LLMOptions>(defaultLLMOptions);
  const [isLLMFilterProcessing, setIsLLMFilterProcessing] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.SIMPLE);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [manualAddPapers, setManualAddPapers] = useState<string[]>([]);
  const [isManuallyAddingPaper, setIsManuallyAddingPaper] = useState(false);

  const [buttonState, setButtonState] = useState<ButtonState>(defaultButtonState);
  const [fullscreenState, setFullscreenState] = useState(false);

  const [searchHistory, setSearchHistory] = useState<SearchForm[]>([]);
  const [currentSearchHistoryIndex, setCurrentSearchHistoryIndex] = useState(0);
  const [diffMode, setDiffMode] = useState(false);
  const [diffSearchHistoryIndex, setDiffSearchHistoryIndex] = useState<null | number>(null);
  const [diffSearchResults, setDiffSearchResults] = useState<SearchResult>(defaultDiffSearchResults);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  
  // TODO: store a search reference id of the results it provides;
  // query endpoint when triggered to get the results of the search
    
  let numMatched = searchResults?.matches?.num_matches;
  let percentageMatched = searchResults?.matches?.percentage_match;
  
  const multiLayerSearchFields: MultiLayerSearch[] = ['primary', 'secondary', 'tertiary']; 


  /**
   * Parses the root papers from the search form, and returns an array of objects with doi and title fields 
   * @param papers DOIs or paper titles 
   * @returns Array of objects with doi and title fields
   */
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

  const handleSearchFormChange = (value: string[], field: MultiLayerSearch) => {
    setSearchForm({
      ...searchForm,
      search_terms: { ...searchForm.search_terms,
        [field]: value
      }
    })
  }

  const handleSearch = async () => {
    if (!validateSearchForm(searchForm, searchMode) || isSearching) return;
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
          showPopulateMetadata: true,
          showHideMetadata: true,
        }))
        setSearchHistory([...searchHistory, { id: res.data.id, ...searchForm}]);
        setCurrentSearchHistoryIndex(searchHistory.length);
      })
      .catch(handleError)
      .finally(() => setIsSearching(false));
  }

  const updateSearchResults = async (papers: Publication[]) => {
    const searchReferenceId = searchHistory[currentSearchHistoryIndex]?.id ?? ""
    await axios.put(
      `${BASE_URL}/scraper/history/publications?search_reference_id=${searchReferenceId}`, 
      { papers }
    ).then((res) => console.log(`Persisted search results with: ${res.data.length} new papers`))
    .catch(handleError);
  }

  const handleAddPaper = async () => {
    if (!manualAddPapers || manualAddPapers.length === 0 || (manualAddPapers.length === 1 && !manualAddPapers[0])) {
      toast.error('No papers to add');
      return;
    }
    setIsManuallyAddingPaper(true);
    toast.info('Adding papers...');
    await axios.post(`${BASE_URL}/scraper/manual-add-publication`, {
      dois: manualAddPapers
    })
    .then(async (res) => {
      let modifiedResults = res.data.publications.map((paper: Publication) => ({...paper, searched_from: "MANUAL", search_string: 'MANUAL'}));
      let newResults = modifiedResults.filter((paper: Publication) => !searchResults.results.find((result: Publication) => result.paper_id === paper.paper_id));
      setSearchResults({...searchResults, results: [...searchResults.results, ...newResults]});
      toast.success('Papers added successfully');
      await updateSearchResults(newResults);
    })
    .catch(handleError)
    .finally(() => setIsManuallyAddingPaper(false));
  }

  const handleSelectAll = () => {
    setSelectedPapers(searchResults.results.map((result: Publication) => result.paper_id))
  }

  const handleDeselectAll = () => {
    setSelectedPapers([])
  }

  const handlePaperSelect = (paper_id: string) => {
    if (selectedPapers.includes(paper_id)) {
      setSelectedPapers(selectedPapers.filter((id) => id !== paper_id))
    } else {
      setSelectedPapers([...selectedPapers, paper_id])
    }
  }

  const handleLLMFiltering = async () => {
    if (!validateLLMQuestionSubmittability()) return;
    setIsLLMFilterProcessing(true);
    await axios.post(`${BASE_URL}/publication/llm-filter`, {
      questions: llmQuestions,
      paper_ids: selectedPapers,
      answers: llmAnswers,
      options: llmOptions,
    })
    .then((res) => {
      // debugger;
      let data = res.data.results
      const updatedResults = searchResults.results.map((result: Publication) => {
        const llm_responses = data.find((response: LLMPaperFilterResponse) => response.paper_id === result.paper_id)?.responses;
        return { ...result, llm_responses }
      });
      setSearchResults({...searchResults, results: updatedResults})
    })
    .catch(handleError)
    .finally(() => setIsLLMFilterProcessing(false));
  }
  
  const handleAddLLMQuestion = () => {
    if (llmQuestions.length >= 5) {
      toast.info('Maximum of 5 questions allowed.');
      return
    }
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
    setSearchForm(defaultSearchForm);
    setSearchResults(defaultSearchResult);
    setSelectedPapers([]);
    setLLMQuestions(defaultLLMQuestions);
    setButtonState(defaultButtonState)
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
  }

  const handleDiffMode = () => {
    
    if (diffMode) {
      handleShowDiffOnly();
      setDiffSearchHistoryIndex(null);
      let prevSearchResults = [...searchResults.results];
      let newPrevSearchResults = prevSearchResults.map((result: Publication) => {
        return { ...result, diffType: undefined }
      });
      setSearchResults({...searchResults, results: newPrevSearchResults});
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
          showForwardSearch: true,
          showBackwardSearch: true,
          showPopulateMetadata: true,
          showHideMetadata: true,
          showExport: true,
        }))
      })
      .catch(handleError)

    } else {
      if (currentSearchHistoryIndex === index) {
        toast.info('Cannot choose the same search history to compare');
        return;
      }
      await axios.get(`${BASE_URL}/scraper/historical-search`, {
        params: { id: searchHistory[index].id }
      })
      .then((res) => handleDiffModeClassification(res.data))
      .catch(handleError)
      .finally(() => setDiffSearchHistoryIndex(index));
    }
  }

  const handleDiffModeClassification = (newSearchResults: SearchResult) => {
    // setDiffSearchResults(newSearchResults); 

    // Handle the diff mode classification here
    // new search result = searchResults
    // old search result = diffSearchResults
    // 1. if paper is only in the new search results, set diffType to 'add'
    // 2. if paper is only in the old search results, set diffType to 'remove'

    let updatedResults = [...searchResults.results];
    let newUpdatedResults = updatedResults.map((result: Publication) => {
      if (!newSearchResults.results.find((r) => r.paper_id === result.paper_id)) {
        return { ...result, diffType: ('add' as DiffType) }
      }
      return { ...result, diffType: ('common' as DiffType) }
    });

    let newDiffSearchResults = newSearchResults.results.map((result: Publication) => {
      const index = searchResults.results.findIndex((r) => r.paper_id === result.paper_id);
      if (index === -1) {
        return { ...result, diffType: ('remove' as DiffType)  }
      }
      return { ...result, diffType: ('common' as DiffType) }
    });

    setSearchResults({...searchResults, results: newUpdatedResults});
    setDiffSearchResults({ ...newSearchResults, results: newDiffSearchResults });
  }

  const handleAdvancedChipClick = (keyword: string, synonym: string) => {
    
    // Surround keyword/synonym phrases with quotes if they contain spaces
    if (keyword.split(' ').length > 1) {
      keyword = `"${keyword}"`;
    }
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

  const handleShowDiffOnly = () => {
    // Handle Original Search Results
    let updatedResults = [...searchResults.results];
    let newUpdatedResults = updatedResults.map((result: Publication) => {
      if (result.diffType === 'common') {
        if (showDiffOnly) return { ...result, show: true }
        else { return { ...result, show: false } }
      }
      return { ...result, show: true }
    });
    setSearchResults({...searchResults, results: newUpdatedResults});

    // Handle diff search results
    let updatedDiffResults = [...diffSearchResults.results];
    let newUpdatedDiffResults = updatedDiffResults.map((result: Publication) => {
      if (result.diffType === 'common') {
        if (showDiffOnly) return { ...result, show: true }
        else { return { ...result, show: false } }
      }
      return { ...result, show: true }
    });
    setDiffSearchResults({...diffSearchResults, results: newUpdatedDiffResults});

    setShowDiffOnly(!showDiffOnly);
  }

  const validateLLMQuestionSubmittability = () => {
    let valid = true;
    for (let i = 0; i < llmQuestions.length; i++) {
      if (!llmQuestions[i].question) {
        valid = false;
        toast.error('Question is required');
        break;
      }
    }
    if (!valid) return false;

    searchResults.results.forEach((result: Publication) => {
     if (selectedPapers.includes(result.paper_id) && !result.abstract) { 
      valid = false; 
      toast.error(`Metadata is required for all papers: ${result.paper_id} does not fulfill the necessary requirement.`);
    }
    });

    if (selectedPapers.length > 50) {
      valid = false;
      toast.error('Maximum of 50 selected papers allowed at once.');
    }
    return valid;
  }

  const handleLLMQuestionChange = (e: ChangeEvent<HTMLInputElement>, question: LLMQuestion) => {
    const updatedQuestions = llmQuestions.map((q) => {
      if (q.id === question.id) return {...q, [e.target.name]: e.target.value}
      return q;
    })
    setLLMQuestions(updatedQuestions);
  }

  const handleLLMOptions = (checked: string | boolean, fieldName: string) => {

    if (fieldName === "includeExamples" && checked && selectedPapers.length > 3) {  
      setLLMAnswers([
        { paper_id: selectedPapers[0], responses: llmQuestions.map((question) => ({ id: question.id, answer: "", rationale: "" })) },
        { paper_id: selectedPapers[1], responses: llmQuestions.map((question) => ({ id: question.id, answer: "", rationale: "" })) },
        { paper_id: selectedPapers[2], responses: llmQuestions.map((question) => ({ id: question.id, answer: "", rationale: "" })) }
      ]);
    }

    setLLMOptions({
      ...llmOptions,
      [fieldName]: Boolean(checked)
    })
  }

  // Fetch the search history from the local storage
  useEffect(() => { 
    const currentVersion = CURRENT_VERSION;
    const userVersion = localStorage.getItem('searchHistory');
    if (!userVersion || parseInt(userVersion) < currentVersion) {
      localStorage.setItem('userArcVersion', currentVersion.toString());
      setShowChangelog(true);
    }
  }, []);

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
                <UsabilityGuide 
                  showUsabilityGuide={showUsabilityGuide} 
                  setShowUsabilityGuide={setShowUsabilityGuide}
                  handleClose={() => setShowUsabilityGuide(false)}
                />
                <ChangelogModal 
                  showChangelog={showChangelog} 
                  setShowChangelog={setShowChangelog}
                />
              </div>
            </div>

            <SearchAppBar searchMode={searchMode} handleSelectSearchMode={handleSelectSearchMode} />

            <div className="divider border-bottom"></div>
            {/* Multi-layer Keyword Search */}
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
                    ? <Spinner />
                    : <span>Search</span>
                  }
                </Button>
                <Tooltip title={tooltipText.search.clearButton} placement="top">
                  <Button className="bg-slate-400 hover:bg-slate-500/80" onClick={resetSearchParameters}>Clear</Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* LLM Questions */}
          {
              buttonState.showLLMQuestions && searchResults.results?.length > 0 &&
              <div className="container p-3 mt-3 border rounded" id="llm-questions">

                <div className="flex flex-row justify-content-between align-items-center">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <h3 className="text-3xl font-medium p-0 m-0">Paper Filter Questions (LLM-Powered)</h3>
                    <div>
                      <Tooltip title={tooltipText.search.llmQuestions} placement="top">
                        <InfoIcon color="info"/>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="llm-examples" checked={llmOptions.includeExamples} onCheckedChange={(checked) => handleLLMOptions(checked, "includeExamples")} />
                      <label htmlFor="llm-examples" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Include examples
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="llm-rationale" checked={llmOptions.includeRationale} onCheckedChange={(checked) => handleLLMOptions(checked, "includeRationale")} />
                      <label htmlFor="llm-rationale" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Include rationale
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="max-height-30vh overflow-y-scroll">
                  <div className="d-flex flex-row gap-2 mt-3 align-items-center">
                    <div className="w-5">#</div>
                    <div className="w-50">Question</div>
                    <div className="w-40">Answer <span className="text-slate-600/60 text-xs">(Comma-separated)</span></div>
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
                  {
                    llmQuestions && llmQuestions.length > 0 && llmQuestions.map((question, index) => (
                        <div key={question.id} className="d-flex flex-row gap-2 mt-3">
                          <div className="d-flex align-items-center justify-content-center w-5">{index + 1}</div>
                          <Input 
                            name="question"
                            className="bg-white"
                            placeholder="Question" 
                            value={question.question} 
                            onChange={(e) => handleLLMQuestionChange(e, question)}
                          />
                          <Input 
                            name="answer"
                            className="bg-white" 
                            placeholder="Answer" 
                            value={question.answer} 
                            onChange={(e) => handleLLMQuestionChange(e, question)}
                          />
                        </div>
                    ))
                  }
                </div>

                {/* Few-shot examples */}
                {
                  llmOptions.includeExamples && selectedPapers.length > 3 &&
                  <div className="flex flex-row mt-3">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead className="bg-primary text-white">
                          <td>Paper ID</td>
                          <td style={{ minWidth: "300px" }}>Paper Title</td>
                          {
                            llmQuestions.map((question) => (
                              <td key={question.id} style={{ minWidth: "300px" }}>
                                Q{question.id}: Answer & Rationale
                              </td>
                            ))
                          }
                        </thead>
                        <tbody>
                        {selectedPapers.length > 0 && selectedPapers.map((paper_id, index) => {
                          let paperName = searchResults.results.find((result) => result.paper_id === paper_id)?.paper_title;
                          if (index < 3) {
                            return (
                              <tr>
                                <td>{paper_id}</td>
                                <td>{paperName}</td>
                                {llmQuestions.map((llmQuestion, questionIdx) => (
                                  <td key={questionIdx}>
                                    <Select 
                                      value={llmAnswers[index]?.responses[questionIdx].answer ?? ""}
                                      onValueChange={(value) => {
                                        let updatedAnswers = [...llmAnswers];
                                        updatedAnswers[index].responses[questionIdx].answer = value;
                                        setLLMAnswers(updatedAnswers);
                                      }}
                                    >
                                      <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Answer" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {llmQuestion.answer.split(',').map((choice) => {
                                          if (choice) return (
                                            <SelectItem key={choice} value={choice}>{choice}</SelectItem>
                                          )})
                                        }
                                      </SelectContent>
                                    </Select>
                                    { 
                                      llmOptions.includeRationale &&
                                      <Input 
                                        placeholder="Rationale" 
                                        className="bg-white"
                                        value={llmAnswers[index]?.responses[questionIdx].rationale ?? ""}
                                        onChange={(e) => {
                                          let updatedAnswers = [...llmAnswers];
                                          updatedAnswers[index].responses[questionIdx].rationale = e.target.value;
                                          setLLMAnswers(updatedAnswers);
                                        }}
                                      />
                                    }
                                  </td>
                                ))}
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                }

                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    className="bg-green-600 hover:bg-green-700/80" 
                    disabled={isLLMFilterProcessing}
                    onClick={handleLLMFiltering}
                  >
                    {isLLMFilterProcessing ? <Spinner /> : "Submit Questions"}
                  </Button>
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
                <div className="flex gap-2">
                  {
                    diffMode &&
                    <Tooltip title={tooltipText.search.history} placement="top">
                      <Button className="bg-slate-400 hover:bg-slate-500/80" onClick={handleShowDiffOnly}>
                        {showDiffOnly ? "Hide Diff Only" : "Show Diff Only"}
                      </Button>
                    </Tooltip>
                  }

                  <Tooltip title={tooltipText.search.history} placement="top">
                    <Button className="bg-blue-500/80" onClick={handleDiffMode} disabled={searchHistory.length < 2}>
                      {!diffMode ? "Enable Diff mode" : "Disable Diff mode"}
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div className="w-100 relative">
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
                            <Tooltip title={
                              <Box>
                                <div>Search {index + 1}</div>
                                <div>Ref: {search.id ?? "-"}</div>
                                <div>Year Range: {search.year_start} - {search.year_end}</div>
                                {
                                  search.search_terms.advanced 
                                  ? <div>Advanced Search: {search.search_terms.advanced}</div>
                                  : <>
                                      <div>Primary Search: {search.search_terms.primary.join(', ')}</div>
                                      <div>Secondary Search: {search.search_terms.secondary.join(', ')}</div>
                                      <div>Tertiary Search: {search.search_terms.tertiary.join(', ')}</div>
                                    </>
                                }
                                <div>Sources: {search.sources.join(', ')}</div>
                              </Box>
                            } placement="top">
                              <Button 
                                className={
                                  cn(
                                    "flex flex-col w-100 h-24 align-items-start bg-slate-50 text-black hover:bg-blue-200/80 border-slate-400 border-1 overflow-scroll",
                                    (index === currentSearchHistoryIndex && !diffMode ? "bg-blue-500/80 hover:bg-blue-600/80 text-white" : "" )+
                                    (index === currentSearchHistoryIndex && diffMode ? "diff-mode-red" : "") + 
                                    (diffMode && diffSearchHistoryIndex === index ? "diff-mode-green" : "")
                                  )
                                }
                              >
                                <span className="leading-[16px]">Search {index + 1} : {search.year_start} - {search.year_end}</span>
                                <span className="text-wrap text-left text-ellipsis overflow-hidden h-[40px]">Ref: {search.id ?? "-"}</span>
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
                            </Tooltip>
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
                      disabled={diffMode}
                      className="form-control rounded-0"
                      placeholder="10.18653/v1/N18-3011"
                      value={manualAddPapers.join(',')}
                      onChange={(e) => setManualAddPapers(e.target.value.split(','))}
                  />
                  <Button 
                    className="bg-blue-500 rounded-0 shadow-none" 
                    disabled={diffMode}
                    onClick={handleAddPaper}
                  >
                    { 
                      isManuallyAddingPaper ? 
                      <CircularProgress size={18} color="inherit" /> :
                      <span>Add</span>
                    } 
                  </Button>
                  <CsvImportField 
                    setManualAddPapers={setManualAddPapers}
                    disabled={diffMode ?? false}
                    tooltip={tooltipText.results.manualAddCsv} 
                  />
              </div>

              <div className='flex flex-wrap gap-2'>
                {
                  buttonState.showSelectAll &&
                  <Tooltip title={tooltipText.results.selectAll} placement="top">
                    <Button className='bg-blue-500' onClick={handleSelectAll} disabled={diffMode}>Select All</Button>
                  </Tooltip>
                }
                {
                  buttonState.showDeselectAll &&
                  <Tooltip title={tooltipText.results.deselectAll} placement="top">
                    <Button className="bg-blue-500" onClick={handleDeselectAll} disabled={diffMode}>Deselect All</Button>
                  </Tooltip>
                }
                {
                  buttonState.showHideMetadata && (showMetadata
                    ? <Button className="bg-green-600 hover:bg-green-700" onClick={handleShowMetadata}>Hide Metadata</Button>
                    : <Button className="bg-green-600 hover:bg-green-700" onClick={handleShowMetadata}>Show Metadata</Button>)
                }

                {/* Paper operations */}
                <PaperOperations
                  selectedPapers={selectedPapers}
                  currentSearchReferenceId={searchHistory[currentSearchHistoryIndex]?.id ?? ""}
                  searchResults={searchResults}
                  setSearchResults={setSearchResults}
                  buttonState={buttonState}
                  setButtonState={setButtonState}
                  diffMode={diffMode}
                />
                <ExportDropdown
                  selectedPapers={selectedPapers}
                  buttonState={buttonState}
                  diffMode={diffMode}
                />
              </div>
            </div>
            
            {
              diffMode &&
              <>
                <div className="search-results row">
                  <div className="col-6">
                    <SearchHistoryHeaderCard 
                      index={currentSearchHistoryIndex}
                      searchHistory={searchHistory} 
                    />
                  </div>
                  <div className="col-6">
                    <SearchHistoryHeaderCard 
                      index={diffSearchHistoryIndex ?? -1}
                      searchHistory={searchHistory} 
                    />
                  </div>
                </div>
              </>
            }

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
                    currentSearchReferenceId={searchHistory[currentSearchHistoryIndex]?.id ?? ""}
                    diffMode={diffMode}
                  />
              </div>
              {/* Diff #2 */}
              {
                diffMode && diffSearchHistoryIndex !== null &&
                <div id="publication-data-table" className="diff-data-table col-6 border h-100">
                  <PublicationTable 
                    searchResults={diffSearchResults} 
                  /> 
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
