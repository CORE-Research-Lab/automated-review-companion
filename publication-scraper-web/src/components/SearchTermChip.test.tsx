import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MultiLayerSearch } from './SearchTermAutocomplete';
import SearchTermChip from './SearchTermChip';

describe('SearchTermChip', () => {

  const props = {
    option: 'AI',
    index: 0,
    getTagProps: jest.fn(),
    field: "primary" as MultiLayerSearch,
    searchResults: {
      matches: {
        num_matches: 0,
        papers: [],
        percentage_match: 0,
      },
      results: [],
      variations: [
        {
          word: 'AI',
          synonyms: [
            {
              meaning: 'artificial intelligence',
              words: ['a.i.'],
            }
          ],
          variants: ['a.i.']
        },
        {
          word: "testWord",
          synonyms: [{
            meaning: "testMeaning",
            words: ["variant1", "variant2"],
          }],
          variants: ["variant1", "variant2"],
        },
      ]
    },
    setSearchResults: jest.fn(),
    handleChipClick: jest.fn(),

  }

  test('renders', () => {
    render(<SearchTermChip {...props} />);
    const searchTermChip = screen.getByText("AI");
    expect(searchTermChip).toBeInTheDocument();
  });

  test('handles chip click action', async () => {
    render(<SearchTermChip {...props} />);
    const searchTermChip = screen.getByText("AI");
    fireEvent.mouseOver(searchTermChip);
    
    act(() => {
      fireEvent(searchTermChip, new MouseEvent('mouseover', { bubbles: true }));
    });
  

    const synonymChip = await screen.findByText("artificial intelligence");
    fireEvent.click(synonymChip);
    
    expect(props.handleChipClick).toHaveBeenCalled();
  }); 

  it('renders normal chip if no variations found', () => {
    const newProps = {
      ...props,
      option: 'ML',
      searchResults: {
        matches: {
          num_matches: 0,
          papers: [],
          percentage_match: 0,
        },
        results: [],
        variations: []
      }
    }
    render(<SearchTermChip {...newProps} />);
    const searchTermChip = screen.getByText("ML");
    expect(searchTermChip).toBeInTheDocument();
  });

});
