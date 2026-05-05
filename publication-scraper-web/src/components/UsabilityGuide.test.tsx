import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import UsabilityGuide from './UsabilityGuide';

const UsabilityGuideHarness = () => {
  const [showUsabilityGuide, setShowUsabilityGuide] = useState(false);
  return (
    <UsabilityGuide
      showUsabilityGuide={showUsabilityGuide}
      setShowUsabilityGuide={setShowUsabilityGuide}
      handleClose={() => setShowUsabilityGuide(false)}
    />
  );
};

describe('App Component', () => {

  test('handles open and close of usability guide with the close button', () => {
    render(<UsabilityGuideHarness />);
    
    const usabilityGuideButton = screen.getByLabelText('Click to view the usability guide');
    fireEvent.click(usabilityGuideButton);
    expect(screen.getByText(/Usability Guide/)).toBeInTheDocument();

    const usabilityGuideCloseButton = screen.getByLabelText('Close usability guide');
    fireEvent.click(usabilityGuideCloseButton);
    expect(screen.queryByText(/Usability Guide/)).not.toBeInTheDocument();
  });

  test('handles open and close of usability guide with the escape key', async () => {
    render(<UsabilityGuideHarness />);
    
    const usabilityGuideButton = screen.getByLabelText('Click to view the usability guide');
    fireEvent.click(usabilityGuideButton);
    expect(screen.getByText(/Usability Guide/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    waitForElementToBeRemoved(() => screen.queryByText(/Usability Guide/));
  });

});
