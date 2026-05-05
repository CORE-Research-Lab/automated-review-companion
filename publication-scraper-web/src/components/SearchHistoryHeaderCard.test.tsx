import { defaultSearchForm } from '@/utils/templates';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SearchHistoryHeaderCard from './SearchHistoryHeaderCard';

describe('SearchHistoryHeaderCard', () => {

  const props = {
    index: 0,
    diffIndex: 0,
    format: "add" as const,
    searchHistory: [{
      id: "abcdef-12345-ghijkl",
      ...defaultSearchForm
    }]
  }

  it('renders', () => {
    render(<SearchHistoryHeaderCard {...props} />);
    const searchHistoryHeaderCard = screen.getByText("Search 1:");
    expect(searchHistoryHeaderCard).toBeInTheDocument();
  });

  it('does not render when index is negative', () => {
    render(<SearchHistoryHeaderCard {...props} index={-1} />);
    const searchHistoryHeaderCard = screen.queryByText("Search 1:");
    expect(searchHistoryHeaderCard).not.toBeInTheDocument();
  })
  
});
