// import { tooltipText } from "@/data/tooltip";
// import { defaultSearchForm } from "@/utils/templates";
// import '@testing-library/jest-dom';
// import { fireEvent, render, screen } from "@testing-library/react";
// import { SearchForm, SearchResult } from "../types";
// import SearchTermAutocomplete, { SearchTermAutocompleteProps } from "./SearchTermAutocomplete";

// const searchResults: SearchResult = {
//   matches: {
//     num_matches: 0,
//     papers: [],
//     percentage_match: 0,
//   },
//   variations: [
//     { word: "AI", synonyms: ["Artificial Intelligence"], variants: ["A.I."] },
//     { word: "ML", synonyms: [], variants: [] },
//   ],
//   results: [],
// };

// const searchForm: SearchForm = {
//   ...defaultSearchForm,
//   search_terms: {
//     advanced: "",
//     primary: ["AI"],
//     secondary: [],
//     tertiary: [],
//   },
// };

// const mockHandleSearchFormChange = jest.fn();
// const mockHandleChipClick = jest.fn();
// const mockSetSearchResults = jest.fn();

// const renderComponent = (field: "primary" | "secondary" | "tertiary") => {
//   const props: SearchTermAutocompleteProps = {
//     field,
//     searchForm,
//     searchResults,
//     setSearchResults: mockSetSearchResults,
//     handleSearchFormChange: mockHandleSearchFormChange,
//     handleChipClick: mockHandleChipClick,
//   };

//   render(<SearchTermAutocomplete {...props} />);
// };

// test("renders the SearchTermAutocomplete component", () => {
//   renderComponent("primary");

//   // Check if the input label renders with the correct tooltip text
//   const inputLabel = screen.getByText("Primary");
//   expect(inputLabel).toBeInTheDocument();
// });

// test("displays placeholder when there are no search terms", () => {
//   renderComponent("secondary");

//   const input = screen.getByPlaceholderText(tooltipText.search.secondary.example);
//   expect(input).toBeInTheDocument();
// });

// test("calls handleSearchFormChange when a new value is selected", () => {
//   renderComponent("primary");

//   // Simulate typing into the autocomplete
//   const input = screen.getByRole("combobox");
//   fireEvent.change(input, { target: { value: "ML" } });

//   // Simulate selecting a value
//   fireEvent.keyDown(input, { key: "Enter" });

//   expect(mockHandleSearchFormChange).toHaveBeenCalledWith(["AI", "ML"], "primary");
// });

// test("renders SearchTermChip components", () => {
//   renderComponent("primary");

//   // Check if the chip for "AI" is rendered
//   const chip = screen.getByText("AI");
//   expect(chip).toBeInTheDocument();
// });
