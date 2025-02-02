import { cn } from "@/lib/utils";
import { SearchForm } from "@/types";

export interface SearchHistoryHeaderCardProps {
  index: number
  searchHistory: SearchForm[];
  format: "remove" | "add";
}
const SearchHistoryHeaderCard: React.FC<SearchHistoryHeaderCardProps> = (props) => {
  const { index, searchHistory, format } = props;

  if (index == -1) {
    return <></>;
  }

  return ( 
    <div className={cn(
      "px-3 py-2 border rounded-t-lg",
      { "bg-[#ffd2d8]": format === "remove" },
      { "bg-[#b0e6be]": format === "add" }
    )}>
      <p><b>Search {index + 1}:</b></p>
      <p>Year: {searchHistory[index]?.start_date.toDateString()} - {searchHistory[index]?.end_date.toDateString()}</p>
      {
        searchHistory[index]?.search_terms.advanced &&
        <p className="text-[16px] leading-[16px] h-100 w-100 text-wrap text-left text-ellipsis overflow-hidden">
          Advanced Search: {searchHistory[index]?.search_terms.advanced}
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