import {
  ButtonState,
  LLMOptions,
  LLMPaperFilterResponse,
  LLMQuestion,
  LLMUserAnswer,
  Publication,
  PublicationOperation,
  SearchResult,
  SnowballingSearch
} from "@/types";
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MinusIcon from '@mui/icons-material/Remove';
import ScreenSearchDesktopIcon from "@mui/icons-material/ScreenSearchDesktop";
import {Checkbox} from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";

import {handleError} from "@/common/handler";
import {parseAuthors} from "@/common/labels";
import {tooltipText} from "@/data/tooltip";
import {cn} from "@/lib/utils";
import {BASE_URL} from "@/utils/common";
import {IconButton, Tooltip} from "@mui/material";
import axios from "axios";
import {ChangeEvent, useState} from "react";
import {toast} from "react-toastify";
import Spinner from "./Spinner";
import {Button} from "./ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "./ui/dropdown-menu";
import {Input} from "./ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./ui/select";

export interface PaperOperationsProps {
    selectedPapers: string[],
    currentSearchReferenceId: string,
    searchResults: SearchResult,
    setSearchResults: React.Dispatch<React.SetStateAction<SearchResult>>,
    buttonState: ButtonState,
    setButtonState: React.Dispatch<React.SetStateAction<ButtonState>>
    diffMode: boolean;

    llmQuestions: LLMQuestion[],
    llmOptions: LLMOptions,
    llmAnswers: LLMUserAnswer[],
    setLLMQuestions: React.Dispatch<React.SetStateAction<LLMQuestion[]>>,
    setLLMOptions: React.Dispatch<React.SetStateAction<LLMOptions>>,
    setLLMAnswers: React.Dispatch<React.SetStateAction<LLMUserAnswer[]>>,
}

const PaperOperations: React.FC<PaperOperationsProps> = (props) => {
    const {
        selectedPapers,
        currentSearchReferenceId,
        buttonState, setButtonState,
        searchResults, setSearchResults,
        diffMode,
        llmQuestions, llmOptions, llmAnswers,
        setLLMQuestions, setLLMOptions, setLLMAnswers
    } = props

    const isPaperOperationsDisabled = selectedPapers.length === 0 || diffMode;
    const [showDialogPrompt, setShowDialogPrompt] = useState<PublicationOperation | null>(null);
    const [snowballingType, setSnowballingType] = useState<string>('');
    const [isPerformingOperation, setIsPerformingOperation] = useState<boolean>(false);
    const [isLLMFilterProcessing, setIsLLMFilterProcessing] = useState(false);

    const operations = [
        {
            icon: <ScreenSearchDesktopIcon fontSize='small' className="me-1"/>,
            label: 'Populate Metadata',
            operation: PublicationOperation.POPULATE_METADATA
        },
        {
            icon: <KeyboardArrowRightIcon fontSize='small' className="me-1"/>,
            label: 'Forward Search',
            operation: PublicationOperation.FORWARD_SEARCH
        },
        {
            icon: <KeyboardArrowLeftIcon fontSize='small' className="me-1"/>,
            label: 'Backward Search',
            operation: PublicationOperation.BACKWARD_SEARCH
        },
        {
            icon: <FilterAltIcon fontSize='small' className="me-1"/>,
            label: "LLM-Powered Filter",
            operation: PublicationOperation.LLM_FILTER
        },
        {
            icon: <DeleteIcon fontSize='small' className="me-1"/>,
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
                return !buttonState.showBackwardSearch
            case PublicationOperation.DELETE:
                return searchResults.results.length === 0
            default:
                return false
        }
    }

    const handleOperationDialog = (operation: PublicationOperation) => {
        return () => setShowDialogPrompt(operation);
    }

    const handleOperation = (operation: PublicationOperation) => {
        return async () => {
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

                if (searchType === "backward") {
                    let updatedResults = [...searchResults.results];
                    res.data.results.forEach((result: SnowballingSearch) => {
                        const index = updatedResults.findIndex((r) => matchDOIs(r.paper_id, result.paper_id));
                        if (index !== -1) {
                            updatedResults[index].references = result.references;
                            updatedResults[index].showReferences = true;
                        }
                    });
                    setSearchResults({...searchResults, results: updatedResults})
                } else if (searchType === "forward") {
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
            .then(() => {
                toast.success(`${selectedPapers.length} paper(s) deleted successfully`);
                const updatedResults = searchResults.results.filter((result: Publication) => !selectedPapers.includes(result.paper_id));
                setSearchResults({...searchResults, results: updatedResults})
            })
            .catch(handleError)
            .finally(() => setShowDialogPrompt(null));
    }

    const handleCloseDialog = () => {
        setShowDialogPrompt(null);
    }

    const handleLLMFiltering = async () => {
        if (!validateLLMQuestionSubmittability()) return;
        setIsLLMFilterProcessing(true);
        await axios.post(`${BASE_URL}/publication/llm-filter`, {
            questions: llmQuestions,
            paper_ids: processSelectedPapers(selectedPapers),
            answers: llmAnswers,
            options: llmOptions,
        })
            .then((res) => {
                // debugger;
                let data = res.data.results
                const updatedResults = searchResults.results.map((result: Publication) => {
                    const llm_responses = data.find((response: LLMPaperFilterResponse) => response.paper_id === result.paper_id)?.responses;
                    return {...result, llm_responses}
                });
                setSearchResults({...searchResults, results: updatedResults})
                setShowDialogPrompt(null);
            })
            .catch(handleError)
            .finally(() => setIsLLMFilterProcessing(false));
    }

    const validateLLMQuestionSubmittability = () => {

        // Validate LLM questions
        let valid = true;
        for (let i = 0; i < llmQuestions.length; i++) {
            if (!llmQuestions[i].question) {
                valid = false;
                toast.error('Question is required');
                break;
            }
        }
        if (!valid) return false;

        // Validate Paper metadata
        let missingMetadataPapers: Publication[] = [];
        searchResults.results.forEach((result: Publication) => {
            if (selectedPapers.includes(result.paper_id) && !result.abstract) {
                valid = false;
                missingMetadataPapers.push(result);
            }
        });
        if (!valid) {
            toast.warn(`Metadata is missing for ${missingMetadataPapers.length} papers: ${missingMetadataPapers.map((paper) => paper.paper_id).join(', ')}`);
            valid = true;
            return valid;
        }

        // Validate selected papers
        if (selectedPapers.length > 50) {
            valid = false;
            toast.error('Maximum of 50 selected papers allowed at once.');
        }
        return valid;
    }

    const processSelectedPapers = (selectedPapers: string[]) => {
        let missingMetadataPapers: Publication[] = [];
        searchResults.results.forEach((result: Publication) => {
            if (selectedPapers.includes(result.paper_id) && !result.abstract) {
                missingMetadataPapers.push(result);
            }
        });
        return selectedPapers.filter((paper_id) => !missingMetadataPapers.map((paper) => paper.paper_id).includes(paper_id));
    }


    const handleAddLLMQuestion = () => {
        if (llmQuestions.length >= 5) {
            toast.info('Maximum of 5 questions allowed.');
            return
        }
        setLLMQuestions([...llmQuestions, {
            id: llmQuestions.length + 1,
            question: '',
            answer: '',
            rationale: ''
        }])
    }


    const handleRemoveLLMQuestion = () => {
        if (llmQuestions.length === 1) {
            toast.info('At least one question is required');
            return;
        }
        setLLMQuestions(llmQuestions.slice(0, llmQuestions.length - 1))
    }

    const handleLLMQuestionChange = (e: ChangeEvent<HTMLInputElement>, question: LLMQuestion) => {
        const updatedQuestions = llmQuestions.map((q) => {
            if (q.id === question.id) return {...q, [e.target.name]: e.target.value}
            return q;
        })
        setLLMQuestions(updatedQuestions);
    }

    const handleLLMOptions = (checked: string | boolean, fieldName: string) => {

        if (fieldName === "includeExamples" && checked && selectedPapers.length > 3) {
            setLLMAnswers([
                {
                    paper_id: selectedPapers[0],
                    responses: llmQuestions.map((question) => ({id: question.id, answer: "", rationale: ""}))
                },
                {
                    paper_id: selectedPapers[1],
                    responses: llmQuestions.map((question) => ({id: question.id, answer: "", rationale: ""}))
                },
                {
                    paper_id: selectedPapers[2],
                    responses: llmQuestions.map((question) => ({id: question.id, answer: "", rationale: ""}))
                }
            ]);
        }
        if (fieldName === "includeExamples" && !checked) {
            setLLMAnswers([]);
            setLLMOptions({
                includeExamples: false,
                includeRationale: false
            })
        } else {
            setLLMOptions({
                ...llmOptions,
                [fieldName]: Boolean(checked)
            })
        }
    }

    let dropdownClasses = cn(
        "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        "bg-slate-500 hover:bg-slate-600 active:border-none dropdown-toggle",
        "hover:cursor-pointer",
        "h-8 rounded-md px-3 text-xs",
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    );

    return (
        <>
            <Dialog
                open={showDialogPrompt !== null}
                // onOpenChange={handleCloseDialog}
                // className="w-full max-w-[425px]"
            >
                <DropdownMenu>
                    <Tooltip
                        title={selectedPapers.length === 0 ? tooltipText.results.operations.enabled : tooltipText.results.operations.disabled}
                        placement="bottom"
                    >
            <span>
              <DropdownMenuTrigger
                  disabled={isPaperOperationsDisabled}
                  className={dropdownClasses}
              >
                {/* <Button 
                  disabled={isPaperOperationsDisabled}
                  className="bg-slate-500 hover:bg-slate-600 active:border-none dropdown-toggle"
                > */}
                  Paper Operations
                  {/* </Button> */}
              </DropdownMenuTrigger>
            </span>
                    </Tooltip>

                    <DropdownMenuContent>
                        {operations.map((operation, index) => (
                            <DialogTrigger asChild key={index}>
                                <DropdownMenuItem
                                    disabled={isOperationDisabled(operation.operation)}
                                    onClick={handleOperationDialog(operation.operation)}
                                >
                                    {operation.icon}
                                    {operation.label}
                                </DropdownMenuItem>
                            </DialogTrigger>
                        ))}

                    </DropdownMenuContent>
                </DropdownMenu>

                {
                    showDialogPrompt === PublicationOperation.LLM_FILTER &&
                    <DialogContent
                        className="max-w-fit max-h-full border overflow-scroll"
                    >
                        <div className="container p-3 mt-3 border rounded" id="llm-questions">
                            <div className="flex flex-row justify-content-between align-items-center">
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                    <DialogTitle>Paper Filter Questions (LLM-Powered)</DialogTitle>
                                    <div>
                                        <Tooltip title={tooltipText.search.llmQuestions} placement="top">
                                            <InfoIcon color="info"/>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="llm-examples" checked={llmOptions.includeExamples}
                                                  onCheckedChange={(checked) => handleLLMOptions(checked, "includeExamples")}/>
                                        <label htmlFor="llm-examples"
                                               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Include examples
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="llm-rationale" data-testid="llm-rationale"
                                                  checked={llmOptions.includeRationale}
                                                  onCheckedChange={(checked) => handleLLMOptions(checked, "includeRationale")}
                                                  disabled={!llmOptions.includeExamples}/>
                                        <label htmlFor="llm-rationale"
                                               className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Include rationale
                                        </label>
                                    </div>
                                    <IconButton onClick={handleCloseDialog}>
                                        <CloseIcon/>
                                    </IconButton>
                                </div>
                            </div>

                            <div className="height-[30vh]">
                                <div className="d-flex flex-row gap-2 mt-3 align-items-center">
                                    <div className="w-5">#</div>
                                    <div className="w-50">Question</div>
                                    <div className="w-40">Answer <span
                                        className="text-slate-600/60 text-xs">(Comma-separated)</span></div>
                                    <div className='flex flex-row gap-2'>
                                        <Tooltip title={tooltipText.search.llmQuestion.add} placement="top">
                                            <IconButton onClick={handleAddLLMQuestion}>
                                                <AddIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={tooltipText.search.llmQuestion.remove} placement="top">
                                            <IconButton onClick={handleRemoveLLMQuestion}>
                                                <MinusIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                </div>
                                {
                                    llmQuestions && llmQuestions.length > 0 && llmQuestions.map((question, index) => (
                                        <div key={question.id} className="d-flex flex-row gap-2 mt-3">
                                            <div
                                                className="d-flex align-items-center justify-content-center w-5">{index + 1}</div>
                                            <Input
                                                name="question"
                                                className="bg-white"
                                                placeholder="Question"
                                                value={question.question}
                                                onChange={(e) => handleLLMQuestionChange(e, question)}
                                            />
                                            <Input
                                                name="answer"
                                                className="bg-white"
                                                placeholder="Answer"
                                                value={question.answer}
                                                onChange={(e) => handleLLMQuestionChange(e, question)}
                                            />
                                        </div>
                                    ))
                                }
                            </div>

                            {
                                (!llmOptions.includeExamples || selectedPapers.length < 3) &&
                                <div
                                    className="flex justify-content-center items-center min-w-[60vw] min-h-[20vh] bg-slate-200 mt-3">
                                    {
                                        !llmOptions.includeExamples &&
                                        <div className="text-slate-600/60 text-center">
                                            Select at least 3 papers to include examples/rationale
                                        </div>
                                    }
                                </div>
                            }

                            {/* Few-shot examples */}
                            {
                                llmOptions.includeExamples && selectedPapers.length > 3 &&
                                <div className="flex flex-row mt-3 min-w-full">
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead className="bg-primary text-white">
                                            <tr>
                                                <td>Paper ID</td>
                                                <td style={{minWidth: "300px"}}>Paper Title</td>
                                                <td style={{minWidth: "300px"}}>Search String</td>
                                                <td style={{minWidth: "300px"}}>Formatted Search String</td>
                                                <td>Abstract</td>
                                                <td style={{minWidth: "300px"}}>Authors</td>
                                                <td style={{minWidth: "300px"}}>Citations Count</td>
                                                <td style={{minWidth: "300px"}}>Conference/Journal</td>
                                                <td style={{minWidth: "300px"}}>DOI</td>
                                                <td>Publication Date</td>
                                                <td>Publication Type</td>
                                                <td>Publisher</td>
                                                {
                                                    llmQuestions.map((question) => (
                                                        <td key={question.id} style={{minWidth: "300px"}}>
                                                            Q{question.id}: Answer & Rationale
                                                        </td>
                                                    ))
                                                }
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedPapers.length > 0 && selectedPapers.map((paper_id, index) => {
                                                let paper = searchResults.results.find((result) => result.paper_id === paper_id);
                                                if (!paper) return;
                                                if (index < 3) {
                                                    return (
                                                        <tr key={paper_id}>
                                                            <td>{paper.paper_id}</td>
                                                            <td>{paper.paper_title}</td>
                                                            <td>{paper.search_string}</td>
                                                            <td>{paper.formatted_search_string}</td>
                                                            <td>
                                                                <div style={{maxHeight: "120px", overflow: "scroll"}}>
                                                                    {paper.abstract}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{maxHeight: "120px", overflow: "scroll"}}>
                                                                    {parseAuthors(paper.authors)}
                                                                </div>
                                                            </td>
                                                            <td>{paper.citation_count}</td>
                                                            <td>{paper.conference_journal}</td>
                                                            <td>{paper.doi}</td>
                                                            <td>{paper.publication_date}</td>
                                                            <td>{paper.publication_type}</td>
                                                            <td>{paper.publisher}</td>
                                                            {llmQuestions.map((llmQuestion, questionIdx) => (
                                                                <td key={questionIdx}>
                                                                    {/* {JSON.stringify(llmAnswers)} */}
                                                                    <Select
                                                                        value={llmAnswers[index]?.responses[questionIdx]?.answer ?? ""}
                                                                        onValueChange={(value) => {
                                                                            let updatedAnswers = [...llmAnswers];
                                                                            updatedAnswers[index].responses[questionIdx].answer = value;
                                                                            setLLMAnswers(updatedAnswers);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="bg-white">
                                                                            <SelectValue placeholder="Select Answer"/>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {llmQuestion.answer.split(',').map((choice) => {
                                                                                if (choice) return (
                                                                                    <SelectItem key={choice}
                                                                                                value={choice}>{choice}</SelectItem>
                                                                                )
                                                                            })
                                                                            }
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {
                                                                        llmOptions.includeRationale &&
                                                                        <Input
                                                                            placeholder="Rationale"
                                                                            className="bg-white"
                                                                            value={llmAnswers[index]?.responses[questionIdx].rationale ?? ""}
                                                                            onChange={(e) => {
                                                                                let updatedAnswers = [...llmAnswers];
                                                                                updatedAnswers[index].responses[questionIdx].rationale = e.target.value;
                                                                                setLLMAnswers(updatedAnswers);
                                                                            }}
                                                                        />
                                                                    }
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                }
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            }

                            <div className="d-flex justify-content-end mt-3">
                                <Button
                                    className="bg-green-600 hover:bg-green-700/80"
                                    disabled={isLLMFilterProcessing}
                                    onClick={handleLLMFiltering}
                                >
                                    {isLLMFilterProcessing ? <Spinner/> : "Submit Questions"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                }

                {
                    showDialogPrompt !== PublicationOperation.LLM_FILTER &&
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{getDialogTitle()}</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            <span>Are you sure about performing the following operation:</span>
                            <br/>
                            <span>{getDialogDescription(selectedPapers.length)}</span>
                        </DialogDescription>
                        <DialogFooter>
                            <Button
                                className=""
                                disabled={isPerformingOperation || snowballingType !== ''}
                                onClick={handleOperation(showDialogPrompt as PublicationOperation)}
                            >
                                {isPerformingOperation ? <Spinner/> : 'Confirm'}
                            </Button>
                            <Button
                                className="bg-slate-500 hover:bg-slate-600 active:border-none shadow-none"
                                onClick={handleCloseDialog}
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                }


            </Dialog>
        </>
    );
}

export default PaperOperations;