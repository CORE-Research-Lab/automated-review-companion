import { cn } from "@/lib/utils";
import { SearchEngineType, SearchForm } from "@/types";
import {Tooltip} from "@mui/material";
import {tooltipText} from "@/data/tooltip.tsx";

export interface DatabaseSelectorProps {
  searchForm: SearchForm;
  setSearchForm: (searchForm: SearchForm) => void;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = (props) => {
  const { searchForm, setSearchForm } = props;

  const parseSearchEngineName = (source: SearchEngineType) => {
    switch (source) {
      case SearchEngineType.DBLP:
        return 'DBLP';
      case SearchEngineType.SEMANTIC_SCHOLAR:
        return 'Semantic Scholar';
      case SearchEngineType.WEB_OF_SCIENCE:
        return 'Web of Science';
      case SearchEngineType.IEEE_XPLORE:
        return 'IEEE Xplore';
      case SearchEngineType.SCOPUS:
        return 'Scopus';
      default:
        return '';
    }
  }
  
  return ( 
       <div className="flex flex-wrap justify-content-start">
        {Object.values(SearchEngineType).map((source) => (
          <Tooltip key={source} title={tooltipText.search.databaseDescription[source]}>
            <div className={cn("input-group-prepend")}>
              <div
                className={cn(
                  "input-group-text h-100 rounded-0",
                  searchForm.sources.includes(source) ? "bg-primary text-white" : "bg-white"
                )}
                onClick={() =>
                  setSearchForm({
                    ...searchForm,
                    sources: searchForm.sources.includes(source)
                      ? searchForm.sources.filter((s) => s !== source)
                      : [...searchForm.sources, source],
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <span>{parseSearchEngineName(source)}</span>
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
    );
  };
 
export default DatabaseSelector;