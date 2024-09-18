import { ButtonState, Publication, PublicationOperation, SearchResult, SnowballingSearch } from "@/types";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ScreenSearchDesktopIcon from "@mui/icons-material/ScreenSearchDesktop";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

import { handleError } from "@/common/handler";
import { tooltipText } from "@/data/tooltip";
import { BASE_URL } from "@/utils/common";
import { Tooltip } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

export interface PaperOperationsProps {
  selectedPapers: string[],
  currentSearchReferenceId: string,
  searchResults: SearchResult,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>,
  buttonState: ButtonState,
  setButtonState: React.Dispatch<React.SetStateAction<ButtonState>>
  diffMode: boolean;
}

const PaperOperations: React.FC<PaperOperationsProps> = (props) => {
  const { 
    selectedPapers, 
    currentSearchReferenceId,
    buttonState, setButtonState,
    searchResults, setSearchResults,
    diffMode
  } = props
 
  const isPaperOperationsDisabled = selectedPapers.length === 0 || diffMode;
  const [showDialogPrompt, setShowDialogPrompt] = useState<PublicationOperation | null>(null);
  const [snowballingType, setSnowballingType] = useState<string>('');
  const [isPerformingOperation, setIsPerformingOperation] = useState<boolean>(false);

  const operations = [
    {
      icon: <ScreenSearchDesktopIcon fontSize='small' className="me-1" />,
      label: 'Populate Metadata',
      operation: PublicationOperation.POPULATE_METADATA
    },
    {
      icon: <KeyboardArrowRightIcon fontSize='small' className="me-1" />,
      label: 'Forward Search',
      operation: PublicationOperation.FORWARD_SEARCH
    },
    {
      icon: <KeyboardArrowLeftIcon fontSize='small' className="me-1" />,
      label: 'Backward Search',
      operation: PublicationOperation.BACKWARD_SEARCH
    },
    {
      icon: <DeleteIcon fontSize='small' className="me-1" />,
      label: 'Delete',
      operation: PublicationOperation.DELETE
    }
  ]

  const isOperationDisabled = (operation: PublicationOperation) => {
    switch (operation) {
      case PublicationOperation.POPULATE_METADATA:
        return !buttonState.showPopulateMetadata
      case PublicationOperation.FORWARD_SEARCH:
        return !buttonState.showForwardSearch
      case PublicationOperation.BACKWARD_SEARCH:
        return !buttonState.showForwardSearch
      case PublicationOperation.DELETE:
        return searchResults.results.length === 0
      default:
        return false
    }
  }

  const handleOperationDialog = (operation: PublicationOperation) => {
    setShowDialogPrompt(operation);  
  }

  const handleOperation = async (operation: PublicationOperation) => {
    switch (operation) {
      case PublicationOperation.POPULATE_METADATA:
        await populateMetadata();
        break
      case PublicationOperation.FORWARD_SEARCH:
        await handleSnowballing("forward");
        break
      case PublicationOperation.BACKWARD_SEARCH:
        await handleSnowballing("backward");
        break
      case PublicationOperation.DELETE:
        handleDeletePapers();
        break
      default:
        break
    }
  }

  const getDialogTitle = () => {
    switch (showDialogPrompt) {
      case PublicationOperation.POPULATE_METADATA:
        return "Populate Metadata"
      case PublicationOperation.FORWARD_SEARCH:
        return "Forward Search"
      case PublicationOperation.BACKWARD_SEARCH:
        return "Backward Search"
      case PublicationOperation.DELETE:
        return "Delete"
      default:
        return ""
    }
  }

  const getDialogDescription = (selectedPapersCount: number) => {
    switch (showDialogPrompt) {
      case PublicationOperation.POPULATE_METADATA:
        return `Populate metadata for ${selectedPapersCount} papers`
      case PublicationOperation.FORWARD_SEARCH:
        return `Forward search for ${selectedPapersCount} papers`
      case PublicationOperation.BACKWARD_SEARCH:
        return `Backward search for ${selectedPapersCount} papers`
      case PublicationOperation.DELETE:
        return `Delete ${selectedPapersCount} papers`
      default:
        return
    }
  }

  const populateMetadata = async () => {
    setIsPerformingOperation(true);
    await axios.post(`${BASE_URL}/scraper/publication-metadata`, {
      paper_ids: selectedPapers
    })
      .then((res) => {
        const data = res.data;
        const updatedResults = searchResults.results.map((result: Publication) => {
          const metadata = data.metadata.find((metadata: Publication) => metadata.paper_id === result.paper_id);
          return {
            ...result,
            ...metadata
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
        setButtonState((prevState) => ({
          ...prevState,
          showLLMQuestions: true,
          showExport: true,
        }))
        toast.success('Metadata populated successfully');
      })
      .catch(handleError)
      .finally(() => {
          setIsPerformingOperation(false);
          setShowDialogPrompt(null);
      });
  }

  const matchDOIs = (originalDOI: string, toMatchDoi: string) => {
    return originalDOI.toLowerCase().includes(toMatchDoi.toLowerCase())
  }

  const handleSnowballing = async (searchType: string) => {
    if (snowballingType) return;
    setSnowballingType(searchType);
    setIsPerformingOperation(true);
    await axios.post(`${BASE_URL}/publication/snowballing`, {
      publication_ids: selectedPapers,
      search_type: searchType,
      show_metadata: true
    })
    .then((res) => {
      let _searchType = searchType.charAt(0).toUpperCase() + searchType.slice(1);
      toast.info(`${_searchType} snowballing search completed`);
      
      if (searchType === "forward") {
        let updatedResults = [...searchResults.results];
        res.data.results.forEach((result: SnowballingSearch) => {
          const index = updatedResults.findIndex((r) => matchDOIs(r.paper_id, result.paper_id));
          if (index !== -1) {
            updatedResults[index].references = result.references;
            updatedResults[index].showReferences = true;
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
      } 
      else if (searchType === "backward") {
        let updatedResults = [...searchResults.results];
        res.data.results.forEach((result: SnowballingSearch) => {
          const index = updatedResults.findIndex((r) => matchDOIs(r.paper_id, result.paper_id));
          if (index !== -1) {
            updatedResults[index].citations = result.citations;
            updatedResults[index].showCitations = true;
          }
        });
        setSearchResults({...searchResults, results: updatedResults})
      }
    })
    .catch(handleError)
    .finally(() => {
      setSnowballingType('');
      setIsPerformingOperation(false);
      setShowDialogPrompt(null);
    });
  }

  const handleDeletePapers = async () => {
    // 1. Remove from search results
    // 2. Update search history in backend
    
    // update results to only include paper ids not in selectedPapers
    await axios.delete(`${BASE_URL}/scraper/history/publications`, {
      params: {
        search_reference_id: currentSearchReferenceId,
        paper_ids: selectedPapers.join(',')
      }
    })
    .then((res) => {
      console.log(res.data);
      toast.success(`${selectedPapers.length} papers deleted successfully`);
      const updatedResults = searchResults.results.filter((result: Publication) => !selectedPapers.includes(result.paper_id));
      setSearchResults({...searchResults, results: updatedResults})
    })
    .catch(handleError)
    .finally(() => {
      setShowDialogPrompt(null);
    });
  }

  const handleCloseDialog = () => {
    setShowDialogPrompt(null);
  }

  return ( 
    <>
      <Dialog open={showDialogPrompt !== null}>
        <DropdownMenu>
          <Tooltip 
            title={selectedPapers.length === 0 ? tooltipText.results.operations.enabled : tooltipText.results.operations.disabled} 
            placement="bottom"
          > 
            <DropdownMenuTrigger disabled={isPaperOperationsDisabled}>
              <Button 
                disabled={isPaperOperationsDisabled}
                className="bg-slate-500 hover:bg-slate-600 active:border-none dropdown-toggle"
              >
                Paper Operations
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent>

            {operations.map((operation, index) => (
              <DialogTrigger asChild key={index}>
                <DropdownMenuItem
                  disabled={isOperationDisabled(operation.operation)}
                  onClick={() => handleOperationDialog(operation.operation)}
                >
                  {operation.icon}
                  {operation.label}
                </DropdownMenuItem>
              </DialogTrigger>
            ))}

          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>Are you sure about perfomring the following operation:</p>
            <br />
            <span>{getDialogDescription(selectedPapers.length)}</span>
          </DialogDescription>
          <DialogFooter>
            <Button 
              className="bg-slate-500 hover:bg-slate-600 active:border-none shadow-none"
              disabled={isPerformingOperation || snowballingType !== ''}
              onClick={() => handleOperation(showDialogPrompt as PublicationOperation)}
            >
              {isPerformingOperation ? <Spinner /> : 'Confirm'}
            </Button>
            <Button className="shadow-none" onClick={handleCloseDialog}>Cancel</Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </>
  );
}
 
export default PaperOperations;