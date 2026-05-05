import { Box, Chip, Tooltip, type ChipProps } from "@mui/material";
import { SearchResult } from "../types";
import { MultiLayerSearch } from "./SearchTermAutocomplete";

type TagProps = Partial<ChipProps> & {
  key?: React.Key;
}

export interface SearchTermProps {
  option: string,
  index: number,
  getTagProps: (params: { index: number }) => TagProps | undefined,
  field: MultiLayerSearch,
  searchResults: SearchResult,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>,
  handleChipClick: (chip: string, field: MultiLayerSearch) => void
}

const SearchTermChip: React.FC<SearchTermProps> = (props) => {
  const { option, index, getTagProps, field, searchResults, handleChipClick } = props;
  const tagProps = getTagProps({ index }) ?? {};
  const { key: tagKey = `${option}-${index}`, ...chipProps } = tagProps;

  if (!searchResults.variations.find((variation) => variation.word === option)) {
    return (
      <Chip
        key={tagKey}
        label={option}
        {...chipProps}
      />
    )
  }

  const variations = searchResults.variations.find((variation) => variation.word === option)
  const synonymGroups = variations?.synonyms.map((synonym) => (
    typeof synonym === "string"
      ? { meaning: synonym, words: [synonym] }
      : synonym
  )) ?? [];
  const hasSynonyms = synonymGroups.length > 0;
  const hasVariants = variations && variations?.variants.length > 0;

  return ( 
    <Tooltip
      className="word-variant-tooltip"
      title={
        <div>
          {
            hasSynonyms &&
            <>
              <span>Synonyms (From <a className="text-blue-300" href={`https://www.thesaurus.com/browse/${option}}`} target="_blank" rel="noreferrer">Thesaurus.com</a>:):</span>
              <Box className="word-variant-box mb-2" width={200}>
                {
                  synonymGroups.map((synonym) => (
                    <div key={option + synonym.meaning}>
                      <div
                        onClick={() => handleChipClick(synonym.meaning, field)}
                        className="word-variant-chip"
                        style={{ color: "black", cursor: "pointer" }}
                      >
                        {synonym.meaning}
                      </div>
                      <div className="word-variant-box">
                        {synonym.words.map((word) => 
                          <div
                            key={option + word}
                            onClick={() => handleChipClick(word, field)}
                            className="word-variant-chip"
                            style={{ color: "black", cursor: "pointer" }}
                          >
                            {word}
                          </div>
                        )}
                      </div>
                    </div>
                ))}
              </Box>
            </>
          }
          {
            hasVariants &&
            <>
              <span>Variants:</span>
              <Box className="word-variant-box" width={200}>
                {
                  searchResults.variations.find((variation) => variation.word === option)?.variants.map((variant) => (
                    <div
                      key={option + variant}
                      onClick={() => handleChipClick(variant, field)}
                      className="word-variant-chip"
                      style={{ color: "black", cursor: "pointer" }}
                    >
                      {variant}
                  </div>
                ))}
              </Box>
            </>
          }
          </div>
        }
      >
    <Chip
      key={tagKey}
      label={option}
      {...chipProps}
    />
   </Tooltip>
  );
}
 
export default SearchTermChip;
