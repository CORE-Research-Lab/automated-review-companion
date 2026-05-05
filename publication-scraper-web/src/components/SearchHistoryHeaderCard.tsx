import { cn } from "@/lib/utils";
import { SearchForm } from "@/types";
import { Change, diffWords } from "diff";

export interface SearchHistoryHeaderCardProps {
  index: number
  diffIndex: number
  searchHistory: SearchForm[];
  format: "remove" | "add";
}

const highlightDiff = (oldText: string, newText: string, format: "remove" | "add") => {
  const differences: Change[] = diffWords(oldText || "", newText || "");

  return differences.map((part, index) => {
    // Only highlight removed parts for "remove" format
    if (format === "remove" && part.removed) {
      return null;
    }
    if (format === "remove" && part.added) {
      return (
        <span key={index} className="text-red-600 bg-red-100">
          {part.value}
        </span>
      );
    }
    
    // Only highlight added parts for "add" format
    if (format === "add" && part.added) {
      return <span key={index} className="text-green-600 bg-green-100">{part.value}</span>
    }
    if (format === "add" && part.removed) {
      return null;
    }

    
    if (!part.added && !part.removed) {
      return <span key={index}>{part.value}</span>;
    }
    return <span key={index}>{part.value}</span>;
  });
};



const SearchHistoryHeaderCard: React.FC<SearchHistoryHeaderCardProps> = (props) => {
  const { index, diffIndex, searchHistory, format } = props;

  const current = searchHistory[index];
  const previous = searchHistory[diffIndex];

  if (index === -1 || diffIndex === -1 || !current || !previous) {
    return <></>;
  }

  return ( 
    <div className={cn(
      "px-3 py-2 border rounded-t-lg",
      { "bg-[#ffd2d8]": format === "remove" },
      { "bg-[#b0e6be]": format === "add" }
    )}>
      <p><b>Search {index + 1}:</b></p>
      <p>Year: {highlightDiff(previous.start_date?.toLocaleDateString("en-GB"), current.start_date?.toLocaleDateString("en-GB"), format)} - {highlightDiff(previous.end_date?.toLocaleDateString("en-GB"), current.end_date?.toLocaleDateString("en-GB"), format)}</p>
      {
        searchHistory[index]?.search_terms.advanced &&
        <p className="text-[16px] leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
          Advanced Search: {highlightDiff(previous.search_terms?.advanced, current.search_terms?.advanced, format)}
        </p>
      }
      {
        searchHistory[index]?.search_terms.primary.length > 0 &&
        <p className="text-[16px] leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
          Primary Search: {searchHistory[index]?.search_terms.primary.join(', ')}
        </p>
      }
      {
        searchHistory[index]?.search_terms.secondary.length > 0 &&
        <p className="text-[16px] leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
          Secondary Search: {searchHistory[index]?.search_terms.secondary.join(', ')}
        </p>
      }
      {
        searchHistory[index]?.search_terms.tertiary.length > 0 &&
        <p className="text-[16px] leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
          Tertiary Search: {searchHistory[index]?.search_terms.tertiary.join(', ')}
        </p>
      }
    </div>
   );
}
 
export default SearchHistoryHeaderCard;
