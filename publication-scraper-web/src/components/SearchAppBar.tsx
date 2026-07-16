import { SearchMode } from "../types";

export interface SearchAppBarProps {
  searchMode: SearchMode,
  handleSelectSearchMode: (mode: SearchMode) => void
}

const SearchAppBar: React.FC<SearchAppBarProps> = (props) => {
  const { searchMode, handleSelectSearchMode } = props;
  return (
      <nav className="d-flex flex-wrap gap-1 mt-3">
        <input
            type="radio"
            className="btn-check"
            name="search-mode"
            id="advanced-search"
            autoComplete='off'
            checked={searchMode === SearchMode.ADVANCED}
            onChange={() => handleSelectSearchMode(SearchMode.ADVANCED)}
        />
        <label className="search-nav-item" htmlFor="advanced-search">Advanced Keyword Search</label>

        <input
            type="radio"
            className="btn-check"
            name="search-mode"
            id="multi-layer-search"
            autoComplete='off'
            checked={searchMode === SearchMode.SIMPLE}
            onChange={() => handleSelectSearchMode(SearchMode.SIMPLE)}
        />
        <label className="search-nav-item" htmlFor="multi-layer-search">Multi-layer Keyword Search</label>
      </nav>
   );
}

export default SearchAppBar;
