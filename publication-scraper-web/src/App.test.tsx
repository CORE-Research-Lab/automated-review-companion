import App from '@/App';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import useEmblaCarousel from "embla-carousel-react"; // Import the hook
import { tooltipText } from './data/tooltip';
import { searchResultResponse } from './tests/test-utils';


// Mock axios
jest.mock('axios');
jest.mock("embla-carousel-react", () => ({
  __esModule: true, // to properly mock ES module
  default: jest.fn(),
}))
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('App Component', () => {
  const mockScrollPrev = jest.fn()
  const mockScrollNext = jest.fn()
  const mockCanScrollPrev = jest.fn(() => true) // Mocking the ability to scroll prev
  const mockCanScrollNext = jest.fn(() => true) // Mocking the ability to scroll next
  const mockReInit = jest.fn()
  const mockScrollTo = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useEmblaCarousel
    (useEmblaCarousel as unknown as jest.Mock).mockReturnValue([
      { current: null }, // carouselRef mock
      {
        scrollPrev: mockScrollPrev,
        scrollNext: mockScrollNext,
        canScrollPrev: mockCanScrollPrev,
        canScrollNext: mockCanScrollNext,
        reInit: mockReInit,
        scrollTo: mockScrollTo,
        on: jest.fn(),
        off: jest.fn(),
      }, // API mock
    ])
  });

  test('renders without crashing', () => { 
    render(<App />);
    expect(screen.getByText(/Search Bar/)).toBeInTheDocument(); 
  });

  test('handles multi-level keyword search form change', () => {
    render(<App />);

    // Advanced search is the default mode; switch to multi-layer search first
    fireEvent.click(screen.getByText('Multi-layer Keyword Search'));

    // Simulate search form change
    const primarySearchInput = screen.getByPlaceholderText(tooltipText.search.primary.example) as HTMLInputElement;
    const secondarySearchInput = screen.getByPlaceholderText(tooltipText.search.secondary.example) as HTMLInputElement;
    const tertiarySearchInput = screen.getByPlaceholderText(tooltipText.search.tertiary.example) as HTMLInputElement;

    const primarySearchTerms = ['AI', 'Machine Learning'];
    const secondarySearchTerms = ['Ethics', 'Bias'];
    const tertiarySearchTerms = ['Education', 'Students'];
    
    const expectedPrimarySearchTerms = "AI,Machine Learning";
    const expectedSecondarySearchTerms = "Ethics,Bias";
    const expectedTertiarySearchTerms = "Education,Students";

    fireEvent.change(primarySearchInput, { target: { value: primarySearchTerms } });
    fireEvent.change(secondarySearchInput, { target: { value: secondarySearchTerms } });
    fireEvent.change(tertiarySearchInput, { target: { value: tertiarySearchTerms } });

    // Add appropriate assertion based on how the state is updated
    expect(primarySearchInput.value).toBe(expectedPrimarySearchTerms);
    expect(secondarySearchInput.value).toBe(expectedSecondarySearchTerms);
    expect(tertiarySearchInput.value).toBe(expectedTertiarySearchTerms);
  });

  test('handles year range search form change', () => {
    render(<App />);
    
    // Simulate search form change
    const startYearInput = document.getElementById('start-date') as HTMLInputElement;
    const endYearInput = document.getElementById('end-date') as HTMLInputElement;

    const startYear = '2023-01-01';
    const endYear = '2024-01-01';
    
    fireEvent.change(startYearInput, { target: { value: startYear } });
    fireEvent.change(endYearInput, { target: { value: endYear } });

    // Add appropriate assertion based on how the state is updated
    expect(startYearInput.value).toBe(startYear);
    expect(endYearInput.value).toBe(endYear);
  });

  test('renders database selection options', () => {
    render(<App />);
    
    // Ensure all database options are rendered
    expect(screen.getByText('DBLP')).toBeInTheDocument();
    expect(screen.getByText('Semantic Scholar')).toBeInTheDocument();
    expect(screen.getByText('Web of Science')).toBeInTheDocument();
    expect(screen.getByText('IEEE Xplore')).toBeInTheDocument();
    expect(screen.getByText('Scopus')).toBeInTheDocument();
  })

  test('handles database selection form change', () => {
    render(<App />);
    
    // Simulate search form change
    const DBLPDatabaseButton = screen.getByText('DBLP');
    const SemanticScholarDatabaseButton = screen.getByText('Semantic Scholar');
    const WebOfScienceDatabaseButton = screen.getByText('Web of Science');
    const IEEE_XploreDatabaseButton = screen.getByText('IEEE Xplore');
    const ScopusDatabaseButton = screen.getByText('Scopus');
    const DBLPDatabaseControl = DBLPDatabaseButton.closest('.input-group-text');
    const SemanticScholarDatabaseControl = SemanticScholarDatabaseButton.closest('.input-group-text');
    const WebOfScienceDatabaseControl = WebOfScienceDatabaseButton.closest('.input-group-text');
    const IEEE_XploreDatabaseControl = IEEE_XploreDatabaseButton.closest('.input-group-text');
    const ScopusDatabaseControl = ScopusDatabaseButton.closest('.input-group-text');
    
    // inital state
    expect(DBLPDatabaseControl).toHaveClass('bg-primary');
    expect(SemanticScholarDatabaseControl).toHaveClass('bg-white');
    expect(WebOfScienceDatabaseControl).toHaveClass('bg-white');
    expect(IEEE_XploreDatabaseControl).toHaveClass('bg-white');
    expect(ScopusDatabaseControl).toHaveClass('bg-white');

    fireEvent.click(DBLPDatabaseButton);
    fireEvent.click(SemanticScholarDatabaseButton);
    fireEvent.click(WebOfScienceDatabaseButton);
    fireEvent.click(IEEE_XploreDatabaseButton);
    fireEvent.click(ScopusDatabaseButton);

    // Check if the color of the button changed
    expect(DBLPDatabaseControl).toHaveClass('bg-white');
    expect(SemanticScholarDatabaseControl).toHaveClass('bg-primary');
    expect(WebOfScienceDatabaseControl).toHaveClass('bg-primary');
    expect(IEEE_XploreDatabaseControl).toHaveClass('bg-primary');
    expect(ScopusDatabaseControl).toHaveClass('bg-primary');
  });

  test('handles validation paper form change', () => {
    render(<App />);
    
    const validationPaperInput = screen.getByPlaceholderText(tooltipText.search.validationPapers.example) as HTMLInputElement;
    const validationPaper = '10.1109/ACCESS.2021.3053725';
    
    fireEvent.change(validationPaperInput, { target: { value: validationPaper } });

    expect(validationPaperInput.value).toBe(validationPaper);
  });


  test('handles search form submission', async () => {
    render(<App />);
    
    // Set up the mock for the axios post request
    mockedAxios.post.mockResolvedValueOnce({ data: searchResultResponse });
    
    // Simulate search button click
    const searchButton = screen.getByText('Search'); // Adjust this text based on your button
    const advancedSearch = screen.getByText('Advanced Keyword Search');
    fireEvent.click(advancedSearch);
    fireEvent.change(screen.getByPlaceholderText('AI AND ("Machine Learning" OR "Generative AI") AND NOT Education'), {
      target: { value: 'AI AND Education' }
    });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/scraper/search-and-clean'), expect.any(Object));
      expect(screen.getByText("Total Publications: 4")).toBeInTheDocument();
      
      // Show grouped result toolbar controls
      expect(screen.getByText('0 selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Selection' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    });
  });

  test('handles clearing search results', async () => {
    render(<App />);

    // Advanced search is the default mode; switch to multi-layer search first
    fireEvent.click(screen.getByText('Multi-layer Keyword Search'));

    // Populate the search results
    const primarySearchInput = screen.getByPlaceholderText(tooltipText.search.primary.example) as HTMLInputElement;
    const secondarySearchInput = screen.getByPlaceholderText(tooltipText.search.secondary.example) as HTMLInputElement;
    const tertiarySearchInput = screen.getByPlaceholderText(tooltipText.search.tertiary.example) as HTMLInputElement;

    const primarySearchTerms = ['AI', 'Machine Learning'];
    const secondarySearchTerms = ['Ethics', 'Bias'];
    const tertiarySearchTerms = ['Education', 'Students'];

    fireEvent.change(primarySearchInput, { target: { value: primarySearchTerms } });
    fireEvent.change(secondarySearchInput, { target: { value: secondarySearchTerms } });
    fireEvent.change(tertiarySearchInput, { target: { value: tertiarySearchTerms } });

    // Change Database to Semantic Scholar
    const DBLPDatabaseButton = screen.getByText('DBLP');
    const SemanticScholarDatabaseButton = screen.getByText('Semantic Scholar');

    fireEvent.click(DBLPDatabaseButton);
    fireEvent.click(SemanticScholarDatabaseButton);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Sleep for 0.1 seconds
    setTimeout(() => {
      expect(primarySearchInput.value).toBe('');
      expect(secondarySearchInput.value).toBe('');
      expect(tertiarySearchInput.value).toBe('');
      expect(DBLPDatabaseButton).toHaveClass('bg-primary');
      expect(SemanticScholarDatabaseButton).toHaveClass('bg-white');
    }, 100);
  });
});
