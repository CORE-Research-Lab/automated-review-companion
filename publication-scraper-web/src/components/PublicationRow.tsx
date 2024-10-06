import { handleError } from '@/common/handler';
// import '@/main.css';
import { BASE_URL } from '@/utils/common';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Tooltip } from '@mui/material';
import axios from 'axios';
import { useEffect } from 'react';
import {
  Author,
  LLMQuestion,
  Publication,
  SearchResult
} from '../types';

export interface PublicationRowProps {
  rowType?: string
  rowIdx?: number | string
  publication: Publication
  handlePaperSelect?: (paper_id: string) => void
  selectedPapers?: string[]
  showMetadata?: boolean
  searchResults: SearchResult
  setSearchResults?: React.Dispatch<React.SetStateAction<SearchResult>>
  llmQuestions?: LLMQuestion[]
  currentSearchReferenceId?: string
  diffMode?: boolean
}

const PublicationRow: React.FC<PublicationRowProps> = (props) => {
  const { 
    rowType, rowIdx,
    publication,
    handlePaperSelect,
    selectedPapers,
    showMetadata,
    searchResults, setSearchResults,
    llmQuestions,
    currentSearchReferenceId,
    diffMode,
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

  const getDiffRowColor = () => {
    if (publication.diffType === 'add') {
      return 'table-row-red bg-[#FFEEF0]';
    } else if (publication.diffType === 'remove') {
      return 'table-row-green bg-[#E6FFED]';
    }
    return '';
  }

  const handleReferencesVisibility = () => {
    if (!setSearchResults) return;
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
    if (!setSearchResults) return;
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

  const turnReferencesAndCitationsInvisible = () => {
    if (!setSearchResults) return;
    const updatedResults = searchResults.results.map((result: Publication) => {
      return {
        ...result,
        showReferences: false,
        showCitations: false
      }
    });
    setSearchResults({...searchResults, results: updatedResults})
  }

  // Only applicable to references/citations
  const addToMainSearchResult = async (paper: Publication) => {
    if (!setSearchResults) return;
    // remove from references/citations from all results' citations/references
    await axios.put(
      `${BASE_URL}/scraper/history/publications?search_reference_id=${currentSearchReferenceId}`, 
      { papers: [paper] }
    )
    .then((res) => {
      console.log(res.data);
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
    })
    .catch(handleError);
  }

  const parseSearchString = (searchString: string[] | string) => {
    if (Array.isArray(searchString)) {
      return `(${searchString.join(', ')})`;
    }
    return searchString
  }

  const getAuthorLabel = (author: Author) => {
    let authorName = author.name;
    if (author.affiliation) {
      let affiliations = author.affiliation.map((affiliate: string) => affiliate.replace(",", ", "))
      authorName += ` (${affiliations.join(", ")})`;
    }
    return authorName;
  }

  useEffect(() => {
    if (diffMode) { turnReferencesAndCitationsInvisible(); }
  }, [diffMode]);

  return (
    <tr key={publication.paper_id}
      className={`${getColorByRowType()} ${getDiffRowColor()} publication-row`}
      style={{ height: "20px" }}
    >
      <td>
        <div className='d-flex items-align-center flex-column gap-2 h-100 w-100'>
          {
            rowType === 'reference' && !diffMode &&
            <Tooltip title="Append to the bottom of the main search results" placement="top">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => addToMainSearchResult(publication)}
              >+</button>
            </Tooltip>
          }
          {
            rowType === 'citation' && !diffMode &&
            <Tooltip title="Append to the bottom of the main search results" placement="top">
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => addToMainSearchResult(publication)}
              >+</button>
            </Tooltip>
          }
          {
            rowType === 'main' && selectedPapers && handlePaperSelect && !diffMode &&
            <>
              <input
                type="checkbox"
                checked={selectedPapers.includes(publication.paper_id)}
                onChange={() => handlePaperSelect(publication.paper_id)}
              />
              {/* Expand/contract references/citations */}
              {
                publication.references && publication.references.length > 0 && !diffMode &&
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
                publication.citations && publication.citations.length > 0 && !diffMode &&
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
      <td style={{ textAlign: "center" }}>{rowIdx}</td>
      <td>{publication.paper_id}</td>
      <td>
        <div className="publication-data-table-cell" style={{ width: "300px" }}>
          <span dangerouslySetInnerHTML={{__html: publication.paper_title }}></span>
        </div>
      </td>
      <td>{publication.searched_from}</td>
      <td>
        <code>          
          {parseSearchString(publication.search_string)}
        </code>
      </td>
      <td>
        <code>
          {publication.formatted_search_string}
        </code>
      </td>
      
      {/* Metadata */}
      {
        showMetadata &&
          <>
            <td>
              <div style={{ maxHeight: "120px", overflow: "scroll"}}>
                {publication.abstract ?? "-"}
              </div>
            </td>
            <td>
              <div className="publication-data-table-cell" style={{ width: "200px"}}>
                {publication.authors?.map((author) => getAuthorLabel(author)).join(', ') ?? "-"}
              </div>
            </td>
            <td>{publication.citation_count ?? "-"}

            </td>
            <td>{publication.conference_journal ?? "-"}</td>
            {/*todo: doi_url isnt working properly, changed to workaround*/}
            <td>
              {publication.doi ? (
                <a href={`https://doi.org/${publication.doi}`}
                  className='text-blue-500 underline'    
                  target="_blank"
                  rel="noopener noreferrer">
                    {publication.doi}
                </a>
              ) : (
                  'Not Available'
              )}
            </td>
            {/* <td>{publication.keywords?.join(', ') ?? "-"}</td> */}
            <td>{publication.publication_date ?? "-"}</td>
            <td>{publication.publication_type ?? "-"}</td>
            <td>
              <div className="publication-data-table-cell" style={{ width: "200px"}}>
                {publication.publisher ?? "-"}
              </div>
            </td>
            <td>
              {publication.semantic_scholar_url ? (
                  <a href={publication.semantic_scholar_url}
                     className='text-blue-500 underline' 
                     target="_blank"
                     rel="noopener noreferrer">
                    View on Semantic Scholar
                  </a>
              ) : (
                  '-'
              )}
            </td>
          </>
      }

      {/* Questions */}
      {
        searchResults.results && searchResults.results.length > 0 &&
        searchResults.results[0].llm_responses && searchResults.results[0].llm_responses.length > 0 &&
        llmQuestions && llmQuestions.length > 0 && llmQuestions.map((response: LLMQuestion, index: number) => (
          <>
            <td key={response.id} style={{ minWidth: "220px" }}>
              {typeof publication.llm_responses === 'undefined' ? "-" : publication.llm_responses[index]?.answer ?? "-"}
            </td>
            <td key={response.id + "-rational"} style={{ minWidth: "220px" }}>
              {typeof publication.llm_responses === 'undefined' ? "-" : publication.llm_responses[index]?.rationale ?? "-"}
            </td>
          </>
        ))
      }
    </tr>
  )

}

export default PublicationRow;