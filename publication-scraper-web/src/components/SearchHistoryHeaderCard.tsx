import { SearchForm } from "@/types";

export interface SearchHistoryHeaderCardProps {
  index: number
  searchHistory: SearchForm[];
}
const SearchHistoryHeaderCard: React.FC<SearchHistoryHeaderCardProps> = (props) => {
  const { index, searchHistory } = props;

  if (index == -1) {
    return <></>;
  }

  return ( 
    <div className="px-3 py-2 border rounded-t-lg bg-slate-500/10">
      <p><b>Search {index + 1}:</b></p>
      <p>Year: {searchHistory[index]?.year_start} - {searchHistory[index]?.year_end}</p>
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