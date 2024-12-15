import App from "@/App";
import { searchResultResponse } from "@/tests/test-utils";
import { defaultButtonState } from "@/utils/templates";
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from "axios";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from 'react-toastify';
import ExportDropdown from "./ExportDropdown";

jest.mock('axios');
jest.mock("embla-carousel-react", () => ({
  __esModule: true, // to properly mock ES module
  default: jest.fn(),
}))
jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(), // Mock the error method
  },
}));
jest.mock('@/common/handler', () => ({
  handleError: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Export Dropdown Integration Test', () => {
  const mockScrollPrev = jest.fn()
  const mockScrollNext = jest.fn()
  const mockCanScrollPrev = jest.fn(() => true) // Mocking the ability to scroll prev
  const mockCanScrollNext = jest.fn(() => true) // Mocking the ability to scroll next

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
        on: jest.fn(),
        off: jest.fn(),
      }, // API mock
    ])    
  });

  test('handles export paper in CSV format', async () => {
    
    // Mock URL.createObjectURL
    const createObjectURLMock = jest.fn(() => 'blob:http://localhost/blob-id');
    window.URL.createObjectURL = createObjectURLMock;

    // Mock anchor click
    const clickMock = jest.fn();
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement.call(document, 'a');
        anchor.click = clickMock;
        return anchor;
      }
      return originalCreateElement.call(document, tagName);
    });


    render(<App />);
    mockedAxios.post.mockResolvedValueOnce({ data: searchResultResponse });
    const searchButton = screen.getByText('Search'); // Adjust this text based on your button
    const advancedSearch = screen.getByText('Advanced Keyword Search');
    fireEvent.click(advancedSearch);
    fireEvent.click(searchButton); 

    await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/scraper/search-and-clean'), expect.any(Object));
        expect(screen.getByText("Total Publications: 4")).toBeInTheDocument();
        
        // Show select, deselect, and hide metadata buttons
        expect(screen.getByText('Select All')).toBeInTheDocument();
        expect(screen.getByText('Deselect All')).toBeInTheDocument();
        expect(screen.getByText('Show Metadata')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    const selectPaperButton = screen.getByText('Select All');    
    const exportButton = screen.getByLabelText('Export Papers');

    await user.click(selectPaperButton);
    await user.click(exportButton);
    
    const menu = screen.getByRole('menu');
    const menuItems = screen.getAllByRole('menuitem');
    const csvMenuItem = screen.getByText('CSV');
    
    expect(exportButton).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toBeInTheDocument();
    expect(menuItems).toHaveLength(3);

    mockedAxios.post.mockResolvedValueOnce({
      data: new Blob(['csv content']),
      headers: {
        'content-disposition': 'attachment; filename="papers.csv"',
      },
    });
    fireEvent.click(csvMenuItem);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Exported papers successfully");
    });
  });
  
});


describe('ExportDropdown Component', () => {
  const mockProps = {
    selectedPapers: ['paper1', 'paper2'],
    buttonState: {
      ...defaultButtonState,
      showExport: true,
    },
    diffMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock calls before each test
  });

  test('renders the component', () => {
    render(<ExportDropdown {...mockProps} />);
    expect(screen.getByLabelText('Export Papers')).toBeInTheDocument();
  });

  test('disables the export button when no papers are selected', () => {
    render(<ExportDropdown selectedPapers={[]} buttonState={defaultButtonState} diffMode={false} />);
    expect(screen.getByLabelText('Export Papers')).toBeDisabled();
  });

  test('disables the export button when in diff mode', () => {
    render(<ExportDropdown {...mockProps} diffMode={true} />);
    expect(screen.getByLabelText('Export Papers')).toBeDisabled();
  });
});