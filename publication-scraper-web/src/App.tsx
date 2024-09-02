import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import { IconButton, Modal, Tooltip } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
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

export interface PublicationRowProps {
  rowType?: string
  publication: Publication
  handlePaperSelect: (paper_id: string) => void
  selectedPapers: string[]
  showMetadata: boolean
  searchResults: SearchResult
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>
  llmQuestions: LLMQuestion[]
}

export interface UsabilityGuideProps {
  handleClose: () => void
} 

const PublicationRow: React.FC<PublicationRowProps> = (props) => {
  const { 
    rowType,
    publication,
    handlePaperSelect,
    selectedPapers,
    showMetadata,
    searchResults,
    llmQuestions,
    setSearchResults
  } = props;

  const getColorByRowType = () => {
    switch (rowType) {
      case 'reference':
        return 'table-info';
      case 'citation':
        return 'table-warning';
      default:
        return '';
    }
  }

  const handleReferencesVisibility = () => {
    const updatedResults = searchResults.results.map((result: Publication) => {
      if (result.paper_id === publication.paper_id) {
        return {
          ...result,
          showReferences: !result.showReferences
        }
      }
      return result;
    });
    setSearchResults({...searchResults, results: updatedResults})
  }

  const handleCitationsVisibility = () => {
    const updatedResults = searchResults.results.map((result: Publication) => {
      if (result.paper_id === publication.paper_id) {
        return {
          ...result,
          showCitations: !result.showCitations
        }
      }
      return result;
    });
    setSearchResults({...searchResults, results: updatedResults})
  }

  // Only applicable to references/citations
  const addToMainSearchResult = (paper: Publication) => {
    // remove from references/citations from all results' citations/references
    const updatedResults = searchResults.results.map((result: Publication) => {
      var references: Publication[] = [];
      var citations: Publication[] = [];
      if (result.references && result.references.length > 0) {
        references = result.references.filter((reference) => reference.paper_id !== paper.paper_id)
      }
      if (result.citations && result.citations.length > 0) {
          citations = result.citations.filter((citation) => citation.paper_id !== paper.paper_id)
      }
      return {
        ...result,
        references,
        citations
      }
    });

    setSearchResults({...searchResults, results: [...updatedResults, paper]})
  }

  return (
    <tr key={publication.paper_id}
      className={getColorByRowType()}
      style={{ height: "20px" }}
    >
      <td>
        <div className='d-flex items-align-center flex-column gap-2 h-100 w-100'>
          {
            rowType === 'reference' &&
            <Tooltip title="Append to the bottom of the main search results" placement="top">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => addToMainSearchResult(publication)}
              >+</button>
            </Tooltip>
          }
          {
            rowType === 'citation' && 
            <Tooltip title="Append to the bottom of the main search results" placement="top">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => addToMainSearchResult(publication)}
              >+</button>
            </Tooltip>
          }
          {
            rowType === 'main' &&
            <>
              <input
                type="checkbox"
                checked={selectedPapers.includes(publication.paper_id)}
                onClick={() => handlePaperSelect(publication.paper_id)}
              />
              {/* Expand/contract references/citations */}
              {
                publication.references && publication.references.length > 0 &&
                <Tooltip title="Expand/Collapse references" placement="top">
                  {publication.showReferences ? 
                    <ExpandMoreIcon 
                      onClick={handleReferencesVisibility}
                      style={{ 
                        cursor: "pointer",
                        color: "blue"
                      }}
                  /> :
                  <ExpandLessIcon 
                    onClick={handleReferencesVisibility}
                    style={{ 
                      cursor: "pointer",
                      color: "blue"
                    }}
                  />}
                </Tooltip>
              }
              {
                publication.citations && publication.citations.length > 0 &&
                <Tooltip title="Expand/Collapse citations" placement="top">
                  {publication.showCitations ?
                    <ExpandMoreIcon 
                      onClick={handleCitationsVisibility}
                      style={{ 
                        cursor: "pointer",
                        color: "#E6A23B"
                      }}
                    /> :
                    <ExpandLessIcon 
                      onClick={handleCitationsVisibility}
                      style={{ 
                        cursor: "pointer",
                        color: "#E6A23B"
                      }}
                    />
                  }
                </Tooltip>
              }
            </>
          }
        </div>
      </td>
      <td>{publication.paper_id}</td>
      <td><p dangerouslySetInnerHTML={{ __html: publication.paper_title}}></p></td>
      <td>{publication.searched_from}</td>
      <td>
        <code>
          {publication.search_string}
        </code>
      </td>
      <td>
        <code>
          {publication.formatted_search_string}
        </code>
      </td>
      <td>{publication.status}</td>
      {/* Metadata */}
      {
        showMetadata && 
        <>
          <td>{publication.abstract ?? "-"}</td>
          <td>{publication.authors?.name ?? "-"}</td>
          <td>{publication.citations_count ?? "-"}</td>
          <td>{publication.conference_journal ?? "-"}</td>
          <td>{publication.doi ?? "-"}</td>
          <td>{publication.doi_url ?? "-"}</td>
          <td>{publication.keywords?.join(', ') ?? "-"}</td>
          <td>{publication.publication_date ?? "-"}</td>
          <td>{publication.publication_type ?? "-"}</td>
          <td>{publication.publisher ?? "-"}</td>
          <td>{publication.semantic_scholar_url ?? "-"}</td>
        </>
      }

      {/* Questions */}
      {
        searchResults.results && searchResults.results.length > 0 && 
        searchResults.results[0].llm_responses && searchResults.results[0].llm_responses.length > 0 &&
        llmQuestions && llmQuestions.length > 0 && llmQuestions.map((response: LLMQuestion, index: number) => (
          <td key={response.id} style={{ minWidth: "220px" }}>Q{index + 1} {response.question}</td>
        ))
      }
    </tr>
  )

}

const UsabilityGuide: React.FC<UsabilityGuideProps> = (props) => {
  const { handleClose } = props;
  return (
    <div className="container p-5 bg-white" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      height: '80%',
      overflow: 'scroll',
      borderRadius: '5px'
    }}>
      <div className="d-flex justify-content-between">
        <h3>Usability Guide</h3>
        <Tooltip title="Close">
          <IconButton onClick={handleClose} color="error" className="pb-3">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </div>

      <h4>Search Bar</h4>
      <div className="divider border-bottom my-3"></div>
      <div className="d-flex flex-column pb-3">
        <span>The search bar allows you to search for publications based on the search terms, year range, and databases selected.</span>
        <span>There are two search modes:</span>
        <ol>
          <li>Simple mode, you can enter primary, secondary, and tertiary search terms.</li>
          <li>Advanced mode, you can enter a case-insensitive boolean search string.
            <ul>
              <li>Use 'AND', 'OR', 'NOT' operators to combine search terms. (Case insensitive) </li>
              <li>Use quotations to search for exact phrases.</li>
            </ul>
          </li>
        </ol>
        <div className="ps-3">
          <li>Year range allows you to filter publications based on the publication year.</li>
          <li>Databases: at least one source must be selected to proceed in searching.</li>
          <li>Root papers allow you to enter the DOI of the root papers to validate if the search configurations result in the root papers.</li>
          <li>Clear button resets and clears all search parameters and results.</li>
        </div>
        <span>To start searching, simply press the Search button.</span>
      </div>
      
      
      <h4>Search Results</h4>
      <div className="divider border-bottom mb-3"></div>
      <div className="d-flex flex-column pb-3">
        <span>The search results display the matched papers based on the search configurations.</span>
        <span>Each row represents a publication with the following columns:</span>
        <ol>
          <li>Checkbox: allows you to select the paper</li>
          <li>Paper ID: the unique identifier of the paper</li>
          <li>Paper Title: the title of the paper</li>
          <li>Searched From: the source where the paper was searched from</li>
          <li>Search String: the search string used to find the paper</li>
          <li>Formatted Search String: the formatted search string</li>
          <li>Status: the status of the paper</li>
        </ol>
        <div className="ps-3">
          <li>Metadata columns are hidden by default. To show the metadata, click on the Metadata button.</li>
          <li>LLM Questions columns are hidden by default. To show the LLM Questions, click on the LLM Questions button.</li>
          <li>Click on the checkbox to select the paper. You can select all papers by clicking on the Select All button.</li>
          <li>Click on the Export button to export the selected papers in CSV/BibTex/RIS format.</li>
        </div>
      </div>

      <h4>Metadata</h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The metadata columns display the metadata of the selected papers.</span>
        <span>The metadata columns include:</span>
        <ol>
          <li>Abstract</li>
          <li>Authors</li>
          <li>Citations Count</li>
          <li>Conference/Journal</li>
          <li>DOI</li>
          <li>DOI URL</li>
          <li>Keywords</li>
          <li>Publication Date</li>
          <li>Publication Type</li>
          <li>Publisher</li>
          <li>Semantic Scholar URL</li>
        </ol>
      </div>

      <h4 className="d-flex justify-content-between">
        <span>LLM Questions</span>
        <span className="badge bg-primary d-flex justify-content">⭐ Advanced Functionality</span>
      </h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The LLM Questions functionality can further filter the papers provided with more insight by the user.</span>
        <span>The LLM engine further filters the papers based on the user's preferences.</span>
        <span className="pb-3">In order to provide a more accurate classification result, it is recommended to ensure metadata for the selected papers are populated.</span>
    
        <ol>
          <li>Question: Each question would be shown as a distinct column for each resulting paper.</li>
          <li>Response: This denotes the possible classifications the LLM can categorize the paper as, based on the metadata</li>
        </ol>
        <span>Click on the LLM Filter button to filter the papers based on the LLM Questions.</span>
    
      </div>

      <h4 className='d-flex justify-content-between'>
        <span>Snowballing Search</span>
        <span className="badge bg-primary d-flex justify-content">⭐ Advanced Functionality</span>
      </h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The Snowballing Search allows you to search for papers that the selected papers cite or that cite the selected papers.</span>
        <span className="pb-3">To perform Snowballing Search, follow the following steps:</span>
        <ol>
          <li>Click on the Forward Search or Backward Search button to start the snowballing search.</li>
          <li>Click on the Expand/Collapse button on the original paper that has undergone snowballing search to view the references and citations of the paper.</li>
        </ol>
        
        <li>References: the papers that the selected paper cites.</li>
        <li>Citations: the papers that cite the selected paper.</li>
      </div>

      
    </div>
  )
};

function App() {
  // components
  const BASE_URL = 'http://localhost:8000/api';
  const [showUsabilityGuide, setShowUsabilityGuide] = useState(false);
  const [searchForm, setSearchForm] = useState<SearchForm>({
    root_papers: [],
    search_terms: {
      advanced: "AI and ('Machine Learning' or 'Generative AI') and not Education",
      primary: '',
      secondary: '',
      tertiary: '',
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
  const [isPopulatingMetadata, setIsPopulatingMetadata] = useState(false);
  const [snowballingType, setSnowballingType] = useState<string>('');
  const [useSimpleMode, setUseSimpleMode] = useState(true);

  const [buttonState, setButtonState] = useState({
    showSelectAll: false,
    showDeselectAll: false,
    showHideMetadata: false,
    showPopulateMetadata: false,
    showForwardSearch: false,
    showBackwardSearch: false,
    showExport: false,
    showLLMQuestions: false,
  })
    

  let isDBLPActive = searchForm.sources.includes("DBLP");
  let isSemanticScholarActive = searchForm.sources.includes("SEMANTIC_SCHOLAR");
  let isWebOfScienceActive = searchForm.sources.includes("WEB_OF_SCIENCE");
  let isXploreActive = searchForm.sources.includes("XPLORE");
  let isIEEEActive = searchForm.sources.includes("IEEE");

  let numMatched = searchResults?.matches?.num_matches;
  let percentageMatched = searchResults?.matches?.percentage_match;

  const tooltipText = {
    usabilityGuide: "Click to view the usability guide",
    search: {
      primary: "Primary search term is required", 
      secondary: "Secondary search term",
      tertiary: "Tertiary search term",
      advanced: "Required field: advanced case-insensitive boolean search string. Use 'AND', 'OR', 'NOT' operators to combine search terms, and quotations to search for exact phrases.",
      yearRange: "Year range including the start and end years (i.e., 2023 - 2024)",
      database: "Select the databases to search from: Click on the database name to toggle the selection; a filled checkbox indicates the database is selected. At least one must be selected.",
      rootPapers: "Enter the DOI of the root papers to validate if the search configurations result in the root papers.",
      clearButton: "Resets and clears all search parameters and results",
      llmQuestions: "Enter the questions to filter the papers. At least one question is required. Answers should be comma-separated categorical answers.",
    },
    results: {
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

  const parseSearchTerms = (terms: string) => {
    if (!terms) return [];
    return terms.split(',')
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
        primary: searchMode === SearchMode.SIMPLE ? parseSearchTerms(searchForm.search_terms.primary) : [],
        secondary: searchMode === SearchMode.SIMPLE ? parseSearchTerms(searchForm.search_terms.secondary) : [],
        tertiary: searchMode === SearchMode.SIMPLE ? parseSearchTerms(searchForm.search_terms.tertiary) : []
      },
      root_papers: parseRootPapers(searchForm.root_papers)
    }

    await axios.post(`${BASE_URL}/scraper/search-and-clean`, payload)
      .then((res) => {
        setSearchResults(res.data)
        setButtonState((prevState) => ({
          ...prevState,
          showSelectAll: true,
          showDeselectAll: true,
          showPopulateMetadata: true,
        }))
      })
      .catch((error) => toast.error('Error:', error.response.data))
      .finally(() => setIsSearching(false));
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
        link.setAttribute('download', `export.${format.toLowerCase()}`);
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
      // toast.info('Results:' + JSON.stringify(res.data))
      
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
      root_papers: [],
      search_terms: {
        advanced: '',
        primary: '',
        secondary: '',
        tertiary: '',
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
    })
  }

  const handleSimpleMode = () => {
    let mode = !useSimpleMode ? 'Simple' : 'Advanced';
    toast.success(`${mode} mode enabled!`);
    setUseSimpleMode(!useSimpleMode);
  }


  return (
    <div className="container mt-3">
      <h1>Publication Scraper</h1>
      
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
                <InfoIcon />
              </button>
            </Tooltip>
            {/* MUI Modal for usability guide */}
            <Modal open={showUsabilityGuide} onClose={() => {setShowUsabilityGuide(false)}}>
              <UsabilityGuide handleClose={() => setShowUsabilityGuide(false)} />
            </Modal>
              

          </div>

        </div>

        {/* Search Mode */}
        <nav className="d-flex">
          <input 
            type="radio" 
            className="btn-check search-nav-item" 
            name="options" 
            id="option1" 
            autoComplete='off' 
            checked={searchMode === SearchMode.SIMPLE}
            onClick={() => handleSelectSearchMode(SearchMode.SIMPLE)}
          />
          <label className="search-nav-item" htmlFor="option1">Simple</label>

          <input 
            type="radio" 
            className="btn-check"
            id="advanced-search" 
            autoComplete='off' 
            checked={searchMode === SearchMode.ADVANCED}
            onClick={() => handleSelectSearchMode(SearchMode.ADVANCED)}
          />
          <label className="search-nav-item" htmlFor="advanced-search">Advanced</label>
        </nav>

        {/* <button 
          type="button" 
          className="btn btn-secondary" 
          data-bs-toggle="tooltip" 
          data-bs-placement="top" 
          data-bs-title="Tooltip on top"
        >
          Tooltip on top
        </button> */}

        <div className="divider border-bottom"></div>
        {/* Three-layered Searchbar */}
        {expandedSearchBar && (
          <div className="mt-3">

            {searchMode === SearchMode.SIMPLE && (
              <div className="input-group mb-3 d-flex flex-column">
                <div className="d-flex flex-row">
                  <div className="input-group-prepend w-25 rounded-0">
                    <Tooltip title={tooltipText.search.primary} placement="right">
                    <div className="input-group-text rounded-0">
                        <span>Primary</span>
                        <span className='text-red'>*</span>
                    </div>
                    </Tooltip>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="i.e., AI, Deep Learning, etc."
                    value={searchForm.search_terms.primary}
                    onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, primary: e.target.value}})}
                  />
                  {/* <Autocomplete
                    className="w-100"
                    multiple
                    freeSolo
                    value={searchForm.search_terms.primary}
                    onChange={(e, value) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, primary: value}})}
                    options={searchResults.variations.map((variation) => variation.word)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Tooltip title={searchResults.variations.find((variation) => variation.word === option)?.synonyms.join(', ')} key={index}>
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                          />
                        </Tooltip>
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        className="p-0 m-0 bg-white w-100"
                        size="small"
                        variant="outlined"
                        placeholder={searchForm.search_terms.primary.length === 0 ? "i.e., AI, Deep Learning, etc." : ""}
                      />
                    )}
                  /> */}
                </div>
                <div className="d-flex flex-row">
                  <div className="input-group-prepend w-25">
                    <Tooltip title={tooltipText.search.secondary} placement="right">
                      <div className="input-group-text d-flex gap-2 rounded-0">
                        Secondary
                      </div>
                    </Tooltip>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="i.e., Ethics, Human-Computer Interaction, etc."
                    value={searchForm.search_terms.secondary}
                    onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, secondary: e.target.value}})}
                  />
                </div>
                <div className="d-flex flex-row">
                  <div className="input-group-prepend w-25 rounded-0">
                    <Tooltip title={tooltipText.search.tertiary} placement="right">
                    <div className="input-group-text d-flex gap-2">Tertiary</div>
                    </Tooltip>
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="i.e., Education, etc."
                    value={searchForm.search_terms.tertiary}
                    onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, tertiary: e.target.value}})}
                  />
                </div>
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
                  placeholder="ie) NOT 'Machine Learning' AND ('Deep Learning' OR 'Neural Networks')"
                  value={searchForm.search_terms.advanced}
                  onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, advanced: e.target.value}})}
                />
              </div>
            )}

            {/* Keyword suggestion */}
            {searchResults.variations && searchResults.variations.length > 0 && 
              <div className="container-fluid py-2">
                  <span>Keywords:</span>
                  <div className="d-flex flex-row flex-nowrap overflow-scroll">
                    {searchResults.variations.map((variation) => (
                      <div className="card card-body" key={variation.word}>
                        <h5>{variation.word}</h5>
                        <div className="d-flex flex-row">
                          <div>
                            <span>Synonyms:</span>
                            <ul>
                              {variation.synonyms.map((synonym) => (
                                <li key={synonym}>{parseKeywordSuggestion(synonym)}</li>
                              ))}
                            </ul>
                          </div>
                          {variation.variants.length > 0 &&
                            <div>
                              <span>Variants:</span>
                              <ul>
                                {variation.variants.map((variant) => (
                                  <li key={variant}>{parseKeywordSuggestion(variant)}</li>
                                ))}
                              </ul>
                            </div>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            }

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
                  checked={isXploreActive}
                  onClick={() => {
                    setSearchForm({
                      ...searchForm,
                      sources: searchForm.sources.find((source) => source === "XPLORE") 
                        ? searchForm.sources.filter((source) => source !== "XPLORE")
                        : [...searchForm.sources, "XPLORE"]
                    })
                  }}
                />
                <label className="btn btn-outline-secondary" htmlFor="btncheck4">Xplore</label>

                <input 
                  type="checkbox" 
                  className="btn-check" 
                  id="btncheck5" 
                  autoComplete="off" 
                  checked={isIEEEActive}
                  onClick={() => {
                    setSearchForm({
                      ...searchForm,
                      sources: searchForm.sources.find((source) => source === "IEEE") 
                        ? searchForm.sources.filter((source) => source !== "IEEE")
                        : [...searchForm.sources, "IEEE"]
                    })
                  }}
                />
                <label className="btn btn-outline-secondary" htmlFor="btncheck5">IEEE</label>
              </div>
            </div>

            {/* Root Papers */}
            <div className="d-flex flex-row w-100">
              <Tooltip title={tooltipText.search.rootPapers} placement='right'>
                <div className="input-group-prepend">
                  <span className="input-group-text rounded-0" id="basic-addon1">Root Papers</span>
                </div>
              </Tooltip>
              <input 
                type="text" 
                className="form-control" 
                placeholder="i.e., 10.1109/ACCESS.2021.3053725, 10.1109/ACCESS.2021.3053726"
                value={searchForm.root_papers.join(',')}
                onChange={(e) => setSearchForm({...searchForm, root_papers: e.target.value.split(',')})}
              />
            </div>

            {/* Root Paper matches */}
            {
              searchForm.root_papers.length > 0 &&
              <div className="d-flex flex-column w-100 mt-3">
                <div className="d-flex flex-row align-items-center gap-2 w-100">
                  <span>Result:</span>
                  <progress className='w-75' value={percentageMatched} max="100" />
                  <span> {numMatched}/{searchForm.root_papers.length} ({percentageMatched}%) matches</span>
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
                <button type="button" className="btn btn-secondary ml-2" onClick={resetSearchParameters}>Clear</button>
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
              <h3 className="p-0 m-0">LLM Questions</h3>
              <div>
                <Tooltip title={tooltipText.search.llmQuestions} placement="top">
                  <InfoIcon color="info" />
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
                  } />
                  <input className="form-control" placeholder="Answer" value={question.answer} onChange={
                    (e) => {
                      const updatedQuestions = llmQuestions.map((q) => {
                        if (q.id === question.id) return {...q, answer: e.target.value}
                        return q;
                      })
                      setLLMQuestions(updatedQuestions);
                    }
                  } />
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
      <div className="container p-3 mt-3 border rounded" id="publication-data">
        {/* Actions */}
        <div className="d-flex flex-row justify-content-between">
          <div className="d-flex justify-content-center flex-row">
            Total Publications: {searchResults.results.length}
          </div>
          <div className='d-flex mb-3 gap-2'>
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
                <button type="button" className="btn btn-secondary" onClick={handleDeselectAll}>Deselect All</button>
              </Tooltip>
            }
            {/* Hide Metadata */}
            {
              buttonState.showHideMetadata && (showMetadata 
              ? <button type="button" className="btn btn-warning" onClick={handleShowMetadata}>Hide Metadata</button>
              : <button type="button" className="btn btn-primary" onClick={handleShowMetadata}>Show Metadata</button>)
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
            {/* Forward/BackwardSearch */}
            {
              !useSimpleMode &&
              buttonState.showForwardSearch &&
              <Tooltip title={tooltipText.results.forwardSearch} placement="top">
                <button type="button" className="btn btn-primary" disabled={snowballingType != ""} onClick={() => handleSnowballing("forward")}>
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
                <button type="button" className="btn btn-primary" disabled={snowballingType != ""} onClick={() => handleSnowballing("backward")}>
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
            <div className="dropdown">
              {
                buttonState.showExport &&
                <Tooltip title={tooltipText.results.export} placement="top">
                  <button className="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Export
                  </button>
                </Tooltip>
              }
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={handleExport("CSV")}>CSV</button></li>
                <li><button className="dropdown-item" onClick={handleExport("BIBTEX")}>Bibtex</button></li>
                <li><button className="dropdown-item" onClick={handleExport("RIS")}>RIS</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Table data */}
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className='bg-primary text-white'>
              <td></td>
              <td>Paper Id</td>
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
                  }}>Abstract</td>
                  <td>Authors</td>
                  <td>Citations Count</td>
                  <td>Conference/Journal</td>
                  <td>DOI</td>
                  <td>DOI URL</td>
                  <td>Keywords</td>
                  <td>Publication Date</td>
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
                  <td key={response.id} style={{ minWidth: "220px" }}>Q{index + 1} {response.question}</td>
                ))
              }
            </thead>
            <tbody>
              {searchResults?.results && searchResults.results.length > 0 && searchResults.results.map((result) => {

                let publicationRows = [];

                publicationRows.push(
                  <PublicationRow 
                    rowType='main'
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
                  result.references.forEach((reference) => {
                    publicationRows.push(
                      <PublicationRow 
                        rowType="reference"
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
    </div>
  )
}

export default App
