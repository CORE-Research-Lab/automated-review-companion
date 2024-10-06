import { tooltipText } from "@/data/tooltip";
import { Autocomplete, TextField } from "@mui/material";
import { SearchForm, SearchResult } from "../types";
import InputLabel from "./InputLabel";
import SearchTermChip from "./SearchTermChip";

export type MultiLayerSearch = "primary" | "secondary" | "tertiary"
export interface SearchTermAutocompleteProps {
  field: MultiLayerSearch,
  searchForm: SearchForm,
  searchResults: SearchResult,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>,
  handleSearchFormChange: (value: string[], field: MultiLayerSearch) => void,
  handleChipClick: (chip: string, field: MultiLayerSearch) => void
}

const SearchTermAutocomplete: React.FC<SearchTermAutocompleteProps> = (props) => {
  const {
    field,
    searchForm,
    searchResults,
    setSearchResults,
    handleSearchFormChange,
    handleChipClick
  } = props;

  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
  const isRequiredField = field === "primary";

  return ( 
    <div className="flex flex-grow h-full">
      <div className="rounded-0 w-25">
        <InputLabel
          tooltip={tooltipText.search[field].hint} 
          label={fieldName} 
          required={isRequiredField} 
          className="w-100 h-full" 
        />
      </div>
      <Autocomplete
        className="w-75"
        multiple
        freeSolo
        value={searchForm.search_terms[field]}
        onChange={(_, value) => handleSearchFormChange(value, field)}
        options={searchResults.variations.map((variation) => variation.word)}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <SearchTermChip
              key={option}
              option={option}
              index={index}
              field={field}
              getTagProps={getTagProps}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              handleChipClick={handleChipClick}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            className="p-0 m-0 bg-white w-100"
            size="small"
            variant="outlined"
            placeholder={searchForm.search_terms[field].length === 0 ? tooltipText.search[field].example : ""}
          />
        )}
      />
    </div>
   );
}
 
export default SearchTermAutocomplete;