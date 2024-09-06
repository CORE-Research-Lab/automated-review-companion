import { Autocomplete, TextField, Tooltip } from "@mui/material";
import React, { SyntheticEvent } from "react";
import { SearchForm, SearchResult } from "../types";
import SearchTermChip from "./SearchTermChip";

export type MultiLayerSearch = "primary" | "secondary" | "tertiary"
export interface SearchTermAutocompleteProps {
  field: MultiLayerSearch,
  searchForm: SearchForm,
  searchResults: SearchResult,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>,
  tooltipText: any,
  handleSearchFormChange: (event: SyntheticEvent, value: string[], field: MultiLayerSearch) => void,
  handleChipClick: (chip: string, field: MultiLayerSearch) => void
}

const SearchTermAutocomplete: React.FC<SearchTermAutocompleteProps> = (props) => {
  const {
    field,
    searchForm,
    searchResults,
    setSearchResults,
    tooltipText,
    handleSearchFormChange,
    handleChipClick
  } = props;

  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
  const isRequiredField = field === "primary" ? true : false;

  return ( 
    <div className="d-flex flex-row">
      <div className="input-group-prepend rounded-0 w-25 d-flex">
        <Tooltip title={tooltipText.search[field].hint} placement="right">
          <div className="input-group-text rounded-0 w-100">
            <span>{fieldName}</span>
            {isRequiredField && <span className='text-red'>*</span>}
          </div>
        </Tooltip>
      </div>
      <Autocomplete
        className="w-100"
        multiple
        freeSolo
        value={searchForm.search_terms[field]}
        onChange={(e, value) => handleSearchFormChange(e, value, field)}
        options={searchResults.variations.map((variation) => variation.word)}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <SearchTermChip
              key={index}
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