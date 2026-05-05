import { forwardSearchResponse, searchResultResponse, testPopulateMetadataResponse, testSearchResultLongResponse } from '@/tests/test-utils';
import { ButtonState, LLMOptions, LLMQuestion, LLMUserAnswer, SearchResult } from '@/types';
import { defaultButtonState, defaultLLMOptions, defaultLLMQuestions } from '@/utils/templates';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { toast } from 'react-toastify';
import PaperOperations, { PaperOperationsProps } from './PaperOperations';

jest.mock('axios');
jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(), // Mock the error method
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
// todo: integration test.....


describe('PaperOperations Component', () => {

  let mockSearchResults: SearchResult;
  let mockButtonState: ButtonState;
  let mockLLMQuestions: LLMQuestion[];
  let mockLLMOptions: LLMOptions;
  let mockLLMAnswers: LLMUserAnswer[];

  let setSearchResults: jest.Mock;
  let setButtonState: jest.Mock;
  let setLLMQuestions: jest.Mock;
  let setLLMOptions: jest.Mock;
  let setLLMAnswers: jest.Mock;



  let props: PaperOperationsProps;

  beforeEach(() => {
    // initalize mock states
    mockSearchResults = searchResultResponse;
    mockButtonState = defaultButtonState;
    mockLLMQuestions = defaultLLMQuestions;
    mockLLMOptions = defaultLLMOptions;
    mockLLMAnswers = [];

    // setup mock setter functions
    setSearchResults = jest.fn((newResults: SearchResult) => (mockSearchResults = newResults));
    setButtonState = jest.fn((newState: ButtonState) => (mockButtonState = newState));
    setLLMQuestions = jest.fn((newQuestions: LLMQuestion[]) => (mockLLMQuestions = newQuestions));
    setLLMOptions = jest.fn((newOptions: LLMOptions) => (mockLLMOptions = newOptions));
    setLLMAnswers = jest.fn((newAnswers: LLMUserAnswer[] | ((prevAnswers: LLMUserAnswer[]) => LLMUserAnswer[])) => {
      mockLLMAnswers = typeof newAnswers === "function" ? newAnswers(mockLLMAnswers) : newAnswers;
      return mockLLMAnswers;
    });

    props = {
      selectedPapers: ["DOI:10.1109/ICALT61570.2024.00037"],
      currentSearchReferenceId: "abcdef-12345-ghijkl",
      searchResults: mockSearchResults,
      setSearchResults: setSearchResults,
      buttonState: mockButtonState,
      setButtonState: setButtonState,
      diffMode: false,
      llmQuestions: mockLLMQuestions,
      llmOptions: mockLLMOptions,
      llmAnswers: mockLLMAnswers,
      setLLMQuestions: setLLMQuestions,
      setLLMOptions: setLLMOptions,
      setLLMAnswers: setLLMAnswers,
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders', () => {
    render(<PaperOperations {...props} />);
    const searchHistoryHeaderCard = screen.getByText("Paper Operations");
    expect(searchHistoryHeaderCard).toBeInTheDocument();
  });
  
  it("opens forward search modal and performs forward search ", async () => {

    mockedAxios.post.mockResolvedValueOnce({ data: forwardSearchResponse });

    render(<PaperOperations {...props} />);
    
    const paperOperationsButton = screen.getByText("Paper Operations");
    await userEvent.click(paperOperationsButton);
  
    const forwardSearchButton = await screen.findByText("Forward Search");
    await userEvent.click(forwardSearchButton);

    const forwardModal = await screen.findByText("Are you sure about performing the following operation:");
    expect(forwardModal).toBeInTheDocument();

    const confirmButton = screen.getByText("Confirm");
    await userEvent.click(confirmButton);
    
    expect(toast.info).toHaveBeenCalledWith("Forward snowballing search completed");
    expect(props.setSearchResults).toHaveBeenCalled();
  });

  it("opens backward search modal and performs backward search ", async () => {
    
    mockedAxios.post.mockResolvedValueOnce({ data: forwardSearchResponse });

    render(<PaperOperations {...props} />);
    
    const paperOperationsButton = screen.getByText("Paper Operations");
    await userEvent.click(paperOperationsButton);

    const backwardSearchButton = await screen.findByText("Backward Search");
    await userEvent.click(backwardSearchButton);

    const backwardModal = await screen.findByText("Are you sure about performing the following operation:");
    expect(backwardModal).toBeInTheDocument();

    const confirmButton = screen.getByText("Confirm");
    await userEvent.click(confirmButton);
    
    expect(toast.info).toHaveBeenCalledWith("Backward snowballing search completed");
    expect(props.setSearchResults).toHaveBeenCalled();
  });

  it("opens populate metadata modal and populates metadata ", async () => {
    
    mockedAxios.post.mockResolvedValueOnce({ data: testPopulateMetadataResponse });

    render(<PaperOperations {...props} />);
    
    const paperOperationsButton = screen.getByText("Paper Operations");
    await userEvent.click(paperOperationsButton);
  
    const populateMetadataButton = await screen.findByText("Populate Metadata");
    await userEvent.click(populateMetadataButton);

    const metadataModal = await screen.findByText("Are you sure about performing the following operation:");
    expect(metadataModal).toBeInTheDocument();

    const confirmButton = screen.getByText("Confirm");
    await userEvent.click(confirmButton);
    
    expect(props.setSearchResults).toHaveBeenCalled();
    expect(props.setButtonState).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Metadata populated successfully");
    expect(props.setSearchResults).toHaveBeenCalled();
  });

  it("keeps papers unchanged when metadata response omits them", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: testPopulateMetadataResponse });
    const searchResultsWithMissingMetadata = {
      ...mockSearchResults,
      results: [
        ...mockSearchResults.results,
        {
          paper_id: "SEMANTIC_SCHOLAR:missing",
          paper_title: "Paper without returned metadata",
          search_string: "original search",
          searched_from: "Semantic Scholar",
          formatted_search_string: "original formatted search",
          status: "NEW",
        },
      ],
    };

    render(
      <PaperOperations
        {...props}
        selectedPapers={[
          "DOI:10.1109/ICALT61570.2024.00037",
          "SEMANTIC_SCHOLAR:missing",
        ]}
        searchResults={searchResultsWithMissingMetadata}
      />
    );

    const paperOperationsButton = screen.getByText("Paper Operations");
    await userEvent.click(paperOperationsButton);

    const populateMetadataButton = await screen.findByText("Populate Metadata");
    await userEvent.click(populateMetadataButton);

    const confirmButton = screen.getByText("Confirm");
    await userEvent.click(confirmButton);

    expect(props.setSearchResults).toHaveBeenCalled();
    const updatedSearchResults = setSearchResults.mock.calls[0][0] as SearchResult;
    expect(updatedSearchResults.results).toContainEqual(
      expect.objectContaining({
        paper_id: "SEMANTIC_SCHOLAR:missing",
        paper_title: "Paper without returned metadata",
        searched_from: "Semantic Scholar",
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Metadata populated successfully");
  });

  it("opens delete papers modal and deletes papers ", async () => {
      
      mockedAxios.delete.mockResolvedValueOnce({ data: forwardSearchResponse });
  
      render(<PaperOperations {...props} />);
      
      const paperOperationsButton = screen.getByText("Paper Operations");
      await userEvent.click(paperOperationsButton);
    
      const deletePapersButton = await screen.findByText("Delete");
      await userEvent.click(deletePapersButton);
  
      const deleteModal = await screen.findByText("Are you sure about performing the following operation:");
      expect(deleteModal).toBeInTheDocument();
  
      const confirmButton = screen.getByText("Confirm");
      await userEvent.click(confirmButton);
      
      expect(toast.success).toHaveBeenCalledWith("1 paper(s) deleted successfully");
      expect(props.setSearchResults).toHaveBeenCalled();
    });

    it("opens llm filter modal and applies filter", async () => {
      const newProps = {
        ...props,
        searchResults: testSearchResultLongResponse,
        selectedPapers: [
          "DOI:10.1109/ICALT61570.2024.00037",
          "DOI:10.1145/3284751.3284756",
          "DOI:10.1145/3340470.3340474",
          "DOI:10.1007/S10639-023-12111-X",
          "DOI:10.1109/ICALT61570.2024.00067",
          "DOI:10.1109/VL/HCC53370.2022.9833130",
          "DOI:10.1007/978-3-030-50402-1_10",
        ],
      };
  
      const { rerender } = render(<PaperOperations {...newProps} />);
  
      // 1. Populate metadata 
      mockedAxios.post.mockResolvedValueOnce({ data: testPopulateMetadataResponse });
      
      const paperOperationsButton = screen.getByText("Paper Operations");
      await userEvent.click(paperOperationsButton);
  
      const populateMetadataButton = await screen.findByText("Populate Metadata");
      await userEvent.click(populateMetadataButton);
  
      const confirmMetadataPopulationButton = await screen.findByText("Confirm");
      await userEvent.click(confirmMetadataPopulationButton);
  
      // 2. Apply LLM filter
      const llmFilterButton = await screen.findByText("LLM-Powered Filter");
      await userEvent.click(llmFilterButton);
    
      const llmFilterModal = await screen.findByText("Paper Filter Questions (LLM-Powered)");
      
      expect(llmFilterModal).toBeInTheDocument();
  
      const llmFilterIncludeExamplesCheckbox = await screen.findByRole("checkbox", { name: /include examples/i });
      const llmFilterIncludeRationaleCheckbox = await screen.findByRole("checkbox", { name: /include rationale/i });
      expect(llmFilterIncludeExamplesCheckbox).toHaveAttribute('aria-checked', 'true');

      // Check attributes
      expect(llmFilterIncludeRationaleCheckbox).toHaveAttribute('data-state', 'checked');
      expect(llmFilterIncludeRationaleCheckbox).toHaveAttribute('aria-checked', 'true');

      const questionInput = await screen.findByPlaceholderText("Question");
      const answerInput = await screen.findByPlaceholderText("Answer");
      expect(questionInput).toBeInTheDocument();
      expect(answerInput).toBeInTheDocument();

      // Fill in questions and apply filter
      questionInput.focus();
      await userEvent.type(questionInput, "Does this paper propose a new algorithm?");
      answerInput.focus();
      await userEvent.type(answerInput, "Yes, No, Maybe, ");
      const answeredQuestions = [{
        ...newProps.llmQuestions[0],
        question: "Does this paper propose a new algorithm?",
        answer: "Yes, No, Maybe, ",
      }];

      rerender(<PaperOperations {...newProps} llmQuestions={answeredQuestions} />); // Re-render with new props

      const examplePaperCheckboxes = screen.getAllByRole("checkbox").slice(2, 6);
      expect(examplePaperCheckboxes).toHaveLength(4);
      for (const checkbox of examplePaperCheckboxes) {
        await userEvent.click(checkbox);
      }

      expect(await screen.findByText("4 chosen")).toBeInTheDocument();
      const tablePresence = await screen.findByText("Paper ID");
      expect(tablePresence).toBeInTheDocument();
      
      // Ensure that table has been populated with a column that contains rationales and examples
      const llmExampleAnswerSelects = await screen.findAllByRole("combobox");
      const rationaleTextInputs = await screen.findAllByPlaceholderText("Rationale");
      expect(llmExampleAnswerSelects).toHaveLength(4);
      expect(rationaleTextInputs).toHaveLength(4);

      rerender(<PaperOperations {...newProps} llmQuestions={answeredQuestions} llmAnswers={mockLLMAnswers} />);
      const submitButton = screen.getByText("Submit Questions");
      await userEvent.click(submitButton);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Choose an example answer"));
      expect(mockedAxios.post).not.toHaveBeenCalledWith(
        expect.stringContaining("/publication/llm-filter"),
        expect.any(Object)
      );

      // screen.debug(undefined, 300000);
      
    //   const llmExampleAnswerSelect1 = await screen.findByLabelText("Select Answer for 1");
    //   const llmExampleAnswerSelect2 = await screen.findByLabelText("Select Answer for 2");
    //   const llmExampleAnswerSelect3 = await screen.findByLabelText("Select Answer for 3");

    //   await userEvent.click(llmExampleAnswerSelect1);
    //   //eslint-disablfe-next-line
      
    //   await userEvent.selectOptions(llmExampleAnswerSelects[0], "Yes");

    //   await userEvent.click(llmExampleAnswerSelects[1]);
    //   await userEvent.selectOptions(llmExampleAnswerSelects[1], "No");

    //   await userEvent.click(llmExampleAnswerSelects[2]);
    //   await userEvent.selectOptions(llmExampleAnswerSelects[2], "Maybe");

    //   const rationaleTextInputs0 = rationaleTextInputs[0];
    //   const rationaleTextInputs1 = rationaleTextInputs[1];
    //   const rationaleTextInputs2 = rationaleTextInputs[2];

    //   rationaleTextInputs0.focus();
    //   await userEvent.type(rationaleTextInputs0, "This paper proposes a new algorithm");
    //   rationaleTextInputs1.focus();
    //   await userEvent.type(rationaleTextInputs1, "This paper does not propose a new algorithm");
    //   rationaleTextInputs2.focus();
    //   await userEvent.type(rationaleTextInputs2, "This paper may propose a new algorithm");

    //   // Check the state after typing
    //   expect(newProps.setLLMQuestions).toHaveBeenCalledWith([
    //     {
    //       question: "Does this paper propose a new algorithm?",
    //       answers: ["Yes", "No", "Maybe"],
    //       rationales: ["This paper proposes a new algorithm", "This paper does not propose a new algorithm", "This paper may propose a new algorithm"],
    //     },
    //   ]);
    //   newProps.llmAnswers = [
    //     {
    //       paper_id: "DOI:10.1109/ICALT61570.2024.00037",
    //       responses: [
    //         {
    //           id: 1,
    //           answer: "Yes",
    //           rationale: "This paper proposes a new algorithm",
    //         }
    //       ]
    //     },
    //     {
    //       paper_id: "DOI:10.1145/3284751.3284756",
    //       responses: [
    //         {
    //           id: 1,
    //           answer: "No",
    //           rationale: "This paper does not propose a new algorithm",
    //         }
    //       ]
    //     },
    //     {
    //       paper_id: "DOI:10.1145/3340470.3340474",
    //       responses: [
    //         {
    //           id: 1,
    //           answer: "Maybe",
    //           rationale: "This paper may propose a new algorithm",
    //         }
    //       ]
    //     }
    // ]

    //   rerender(<PaperOperations {...newProps} />); // Re-render with new props

  
    //   // Fill in questions and apply filter
    //   const confirmButton = screen.getByText("Apply Filter");
    //   await userEvent.click(confirmButton);
      
    //   expect(props.setLLMOptions).toHaveBeenCalled();
    });



});
