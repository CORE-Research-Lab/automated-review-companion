import axios from 'axios';
import { useState } from 'react';
import './main.css';

function App() {

  const [searchForm, setSearchForm] = useState({
    root_papers: [],
    search_terms: {
      advanced: "AI and ('Machine Learning' or 'Generative AI') and not Education",
      primary: '',
      secondary: '',
      teritary: '',
    },
    year_start: 2023,
    year_end: 2024,
    sources: ["DBLP"],
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);

  let isDBLPActive = searchForm.sources.includes("DBLP");
  let isSemanticScholarActive = searchForm.sources.includes("SEMANTIC_SCHOLAR");
  let isWebOfScienceActive = searchForm.sources.includes("WEB_OF_SCIENCE");


  const parseSearchTerms = (terms: string) => {
    if (!terms) return [];
    return terms.split(',')
  }

  const handleSearch = async () => {

    const payload = {
      ...searchForm,
      search_terms: {
        advanced: searchForm.search_terms.advanced,
        primary: parseSearchTerms(searchForm.search_terms.primary),
        secondary: parseSearchTerms(searchForm.search_terms.secondary),
        teritary: parseSearchTerms(searchForm.search_terms.teritary)
      }
    }

    await axios.post('http://localhost:8000/api/scraper/search-and-clean', payload)
      .then((res) => setSearchResults(res.data.results))
      .catch((error) => console.error('Error:', error));
  }

  const populateMetadata = async () => {
    console.log(selectedPapers)
    await axios.post('http://localhost:8000/api/scraper/publication-metadata', {
      paper_ids: selectedPapers
    })
      .then((res) => console.log(res.data))
      .catch((error) => console.error('Error:', error));
  }

  return (
    <div>
      <div className="container p-3 mt-3 border rounded" id="search-bar">

        {/* Three-layered Searchbar */}
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
              <span className="input-group-text" id="basic-addon1">Teritary</span>
            </div>
            <input 
              type="text" 
              className="form-control" 
              placeholder="ie) Education, etc."
              value={searchForm.search_terms.teritary}
              onChange={(e) => setSearchForm({...searchForm, search_terms: {...searchForm.search_terms, teritary: e.target.value}})}
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
        <div className="d-flex flex-row w-100">
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

        {/* Buttons */}
        <div className="d-flex flex-row justify-content-end mt-3 gap-2">
          <button type="button" className="btn btn-primary" onClick={handleSearch}>Search</button>
          <button type="button" className="btn btn-secondary ml-2">Clear</button>
        </div>

      </div>
      <div className="container p-3 mt-3 border rounded" id="publication-data">
        
        {/* Actions */}
        <div className="d-flex flex-row justify-content-end mb-3 gap-2">
          {/* Select All */}
          <button type="button" className="btn btn-primary">Select All</button>
          <button type="button" className="btn btn-secondary ml-2">Deselect All</button>
          {/* Popualte metadata */}
          <button 
            type="button" 
            className="btn btn-success ml-2"
            onClick={populateMetadata}
          >
            Populate Metadata
          </button>
          {/* Export */}
          <button type="button" className="btn btn-success ml-2">Export</button>
        </div>

        {/* Table data */}
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className='bg-primary text-white'>
              <td></td>
              <td>Paper Id</td>
              <td>Title</td>
              <td>Source</td>
              <td>Search String</td>
              <td>Formatted Search String</td>
              <td>Status</td>
            </thead>
            <tbody>
              {searchResults && searchResults.length && searchResults.map((result: any) => (
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPapers.includes(result.paper_id)}
                      onClick={() => setSelectedPapers([...selectedPapers, result.paper_id])}
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
