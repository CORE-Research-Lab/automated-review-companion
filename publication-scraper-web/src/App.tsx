import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import './main.css';

export type SearchResult = {
  matches: SearchMatch,
  results: Publication[],
  variations: KeywordVariation[],
}

export type KeywordVariation = {
  word: string,
  variants: string[]
  synonyms: string[]
}

export type SearchMatch = {
  num_matches: number,
  papers: SearchMatchPaper[],
  percentage_match: number
}

export type SearchMatchPaper = {
  doi: string,
  title: string
}

export type Publication = {
  paper_id: string,
  paper_title: string,
  searched_from: string,
  search_string: string,
  formatted_search_string: string,
  status: string

  // Metadata fields
  abstract?: string,
  authors?: Author,
  citations_count?: number,
  conference_journal?: string,
  doi?: string,
  doi_url?: string,
  keywords?: string[],
  publication_date?: string,
  publication_type?: string[],
  publisher?: string,
  semantic_scholar_url?: string,

  // LLM Questions
  llm_responses?: LLMQuestion[]
}

export type SnowballingSearch = Publication & {
  references?: Publication[]
  citations?: Publication[]
}

export type Author = {
  name: string,
  affiliation: string[],
}

export type SearchForm = {
  root_papers: string[],
  search_terms: {
    advanced: string,
    primary: string,
    secondary: string,
    tertiary: string
  },
  year_start: number,
  year_end: number,
  sources: SearchEngineType[]
}

export type SearchEngineType = "DBLP" | "SEMANTIC_SCHOLAR" | "WEB_OF_SCIENCE";

export type LLMQuestion = {
  id: number,
  question: string,
  answer: string
}

export type LLMPaperFilterResponse = {
  paper_id: string,
  response: LLMQuestion[]
}


function App() {

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
  const [expandedSearchBar, setExpandedSearchBar] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isPopulatingMetadata, setIsPopulatingMetadata] = useState(false);

  let isDBLPActive = searchForm.sources.includes("DBLP");
  let isSemanticScholarActive = searchForm.sources.includes("SEMANTIC_SCHOLAR");
  let isWebOfScienceActive = searchForm.sources.includes("WEB_OF_SCIENCE");

  let numMatched = searchResults?.matches?.num_matches;
  let percentageMatched = searchResults?.matches?.percentage_match;

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
        doi: doi ? doi : '',
        title: doi ? '' : paper
      }
    })
  }

  const handleSearch = async () => {

    const payload = {
      ...searchForm,
      search_terms: {
        advanced: searchForm.search_terms.advanced,
        primary: parseSearchTerms(searchForm.search_terms.primary),
        secondary: parseSearchTerms(searchForm.search_terms.secondary),
        tertiary: parseSearchTerms(searchForm.search_terms.tertiary)
      },
      root_papers: parseRootPapers(searchForm.root_papers)
    }

    await axios.post('http://localhost:8000/api/scraper/search-and-clean', payload)
      .then((res) => setSearchResults(res.data))
      .catch((error) => toast.error('Error:', error.response.data));
  }

  const populateMetadata = async () => {
    setIsPopulatingMetadata(true);
    await axios.post('http://localhost:8000/api/scraper/publication-metadata', {
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
    await axios.post('http://localhost:8000/api/scraper/export', {
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

  const handleSnowballing = async (searchType: string) => {

    await axios.post('http://localhost:8000/api/publication/snowballing', {
      publication_ids: selectedPapers,
      search_type: searchType,
      show_metadata: true
    })
    .then((res) => {
      toast.success('Snowballing successful');
      toast.info('Results:' + JSON.stringify(res.data))
      
      if (searchType === "forward") {
        const allReferences = res.data.results.map((result: SnowballingSearch) => result.references).flat();
        const updatedResults = searchResults.results.concat(allReferences);
        setSearchResults({...searchResults, results: updatedResults})
      } 
      else if (searchType === "backward") {
        const allCitations = res.data.results.map((result: SnowballingSearch) => result.citations).flat();
        const updatedResults = searchResults.results.concat(allCitations);
        setSearchResults({...searchResults, results: updatedResults})
      }
    })
    .catch((error) => {
      console.log(error);
      toast.error('Error:', error)
    });
  }

  const handleLLMFiltering = async () => {
    await axios.post('http://localhost:8000/api/publication/llm-filter', {
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


  const toggleSearchBar = () => {
    setExpandedSearchBar(!expandedSearchBar)
  }


  return (
    <div className="container mt-3">
      <h1>Publication Scraper</h1>
      
      {/* Search Bar */}
      <div className="container p-3 mt-3 border rounded" id="search-bar">

        <div className="d-flex flex-row justify-content-between">
          <h3>Search Bar</h3>
          <button className="btn btn-primary" onClick={toggleSearchBar}>Toggle Search Bar</button>
        </div>
        {/* Three-layered Searchbar */}
        {expandedSearchBar && (
          <div className="mt-3">
            <div className="input-group mb-3 d-flex flex-column">
              <div className="d-flex flex-row">
                <div className="input-group-prepend w-25">
                  <span className="input-group-text" id="basic-addon1">Primary</span>
                </div>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ie) AI, Deep Learning, etc."
                  value={searchForm.search_terms.primary}
                  onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, primary: e.target.value}})}
                />
              </div>
              <div className="d-flex flex-row">
                <div className="input-group-prepend w-25">
                  <span className="input-group-text" id="basic-addon1">Secondary</span>
                </div>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ie) Ethics, Human-Computer Interaction, etc."
                  value={searchForm.search_terms.secondary}
                  onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, secondary: e.target.value}})}
                />
              </div>
              <div className="d-flex flex-row">
                <div className="input-group-prepend w-25">
                  <span className="input-group-text" id="basic-addon1">Tertiary</span>
                </div>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ie) Education, etc."
                  value={searchForm.search_terms.tertiary}
                  onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, tertiary: e.target.value}})}
                />
              </div>
            </div>

            {/* Advaned Search Bar */}
            <div className="input-group mb-3">
              <div className="input-group-prepend">
                <span className="input-group-text" id="basic-addon1">Advanced Search</span>
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ie) NOT 'Machine Learning' AND ('Deep Learning' OR 'Neural Networks')"
                value={searchForm.search_terms.advanced}
                onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, advanced: e.target.value}})}
              />
            </div>

            {/* Keyword suggestion */}
            {searchResults.variations && searchResults.variations.length > 0 && 
              <div className="container-fluid py-2">
                  <span>Keywords:</span>
                  <div className="d-flex flex-row flex-nowrap overflow-scroll">
                    {searchResults.variations.map((variation, index) => (
                      <div className="card card-body" key={index}>
                        <h5>{variation.word}</h5>
                        <div className="d-flex flex-row">
                          <div>
                            <span>Synonyms:</span>
                            <ul>
                              {variation.synonyms.map((synonym, index) => (
                                <li key={index}>{parseKeywordSuggestion(synonym)}</li>
                              ))}
                            </ul>
                          </div>
                          {variation.variants.length > 0 &&
                            <div>
                              <span>Variants:</span>
                              <ul>
                                {variation.variants.map((variant, index) => (
                                  <li key={index}>{parseKeywordSuggestion(variant)}</li>
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
              <div className="input-group-prepend">
                <span className="input-group-text" id="basic-addon1">Year Range</span>
              </div>
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
              <div className="input-group-prepend">
                <span className="input-group-text" id="basic-addon1">Database:</span>
              </div>
              <div className="btn-group" role="group" aria-label="Database selection">
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
              </div>
            </div>

            {/* Root Papers */}
            <div className="d-flex flex-row w-100">
              <div className="input-group-prepend">
                <span className="input-group-text" id="basic-addon1">Root Papers:</span>
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ie) 10.1109/ACCESS.2021.3053725, 10.1109/ACCESS.2021.3053726"
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
                      <td>#</td>
                      <td>DOI/Paper Title</td>
                    </thead>
                    <tbody>
                      {/* Show the percentage matched with a progress bar (bootstrap), the total number of matches, and all the matches in tiny rows */}
                      {
                        searchResults && searchResults.matches && searchResults.matches.papers && 
                        searchResults.matches.papers.length && searchResults.matches.papers.map((match, index) => (
                          <tr key={index}>
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
              <button type="button" className="btn btn-primary" onClick={handleSearch}>Search</button>
              <button type="button" className="btn btn-secondary ml-2">Clear</button>
            </div>
          </div>)
        }
      </div>

      {/* LLM Questions */}
      {
        searchResults.results && searchResults.results.length > 0 &&
        <div className="container p-3 mt-3 border rounded" id="llm-questions">

          <div className="d-flex flex-row justify-content-between align-items-center">
            <h3>LLM Questions</h3>
            <div className='d-flex flex-row gap-2'>
              <button className="btn btn-primary" onClick={handleAddLLMQuestion}>Add Question</button>
              <button className="btn btn-secondary" onClick={handleRemoveLLMQuestion}>Remove a Question</button>
            </div>
          </div>
          <div className="max-height-30vh overflow-y-scroll">
            {
              llmQuestions && llmQuestions.length > 0 && llmQuestions.map((question, index) => (
                <div className="d-flex flex-row gap-2 mt-3">
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
            <button type="button" className="btn btn-primary" onClick={handleSelectAll}>Select All</button>
            <button type="button" className="btn btn-secondary" onClick={handleDeselectAll}>Deselect All</button>
            {/* Hide Metadata */}
            {
              showMetadata 
              ? <button type="button" className="btn btn-warning" onClick={handleShowMetadata}>Hide Metadata</button>
              : <button type="button" className="btn btn-primary" onClick={handleShowMetadata}>Show Metadata</button>
            }
            
            {/* Popualte metadata */}
            <button 
              type="button" 
              className="btn btn-success"
              onClick={populateMetadata}
            >
              {
                !isPopulatingMetadata 
                ? <span>Populate Metadata</span>
                : <div className="spinner-border text-light" role="status">
                  <span className="sr-only"></span>
                </div>

              }
            </button>
            {/* Forward/BackwardSearch */}
            <button type="button" className="btn btn-primary" onClick={() => handleSnowballing("forward")}>Forward Search</button>
            <button type="button" className="btn btn-primary" onClick={() => handleSnowballing("backward")}>Backward Search</button>

            {/* Export */}
            <div className="dropdown">
              <button className="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Export
              </button>
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
                  <td style={{ minWidth: "220px" }}>Q{index + 1} {response.question}</td>
                ))
              }
            </thead>
            <tbody>
              {searchResults && searchResults.results && searchResults.results.length > 0 && searchResults.results.map((result: any) => (
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPapers.includes(result.paper_id)}
                      onClick={() => handlePaperSelect(result.paper_id)}
                    />
                  </td>
                  <td>{result.paper_id}</td>
                  <td><p dangerouslySetInnerHTML={{ __html: result.paper_title}}></p></td>
                  <td>{result.searched_from}</td>
                  <td>
                    <code>
                      {result.search_string}
                    </code>
                  </td>
                  <td>
                    <code>
                      {result.formatted_search_string}
                    </code>
                  </td>
                  <td>{result.status}</td>
                  {/* Metadata */}
                  {
                    showMetadata && 
                    <>
                      <td>{result.abstract ?? "-"}</td>
                      <td>{result.authors?.name ?? "-"}</td>
                      <td>{result.citation_count ?? "-"}</td>
                      <td>{result.conference_journal ?? "-"}</td>
                      <td>{result.doi ?? "-"}</td>
                      <td>{result.doi_url ?? "-"}</td>
                      <td>{result.keywords?.join(', ') ?? "-"}</td>
                      <td>{result.publication_date ?? "-"}</td>
                      <td>{result.publication_type?.join(', ')  ?? "-"}</td>
                      <td>{result.publisher  ?? "-"}</td>
                      <td>
                        <a href={result.semantic_scholar_url} target="_blank" rel="noreferrer">
                          {result.semantic_scholar_url ?? "-"}
                        </a>
                      </td>
                    </>
                  }
                  {
                    result.llm_responses && result.llm_responses.length > 0 && 
                    result.llm_responses.map((response: LLMQuestion) => (
                      <td>
                        <p>{response.answer}</p>
                      </td>
                    ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default App
