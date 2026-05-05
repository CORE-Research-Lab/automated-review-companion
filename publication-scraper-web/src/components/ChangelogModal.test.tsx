import '@testing-library/jest-dom';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ChangelogModal from './ChangelogModal';

const ChangelogHarness = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  return (
    <ChangelogModal
      showChangelog={showChangelog}
      setShowChangelog={setShowChangelog}
      handleClose={() => setShowChangelog(false)}
    />
  );
};

describe('Changelog Modal', () => {

  test('handles open and close of changelog', () => {
    render(<ChangelogHarness />);
    
    const changelogButton = screen.getByLabelText('Click to view the changelog');
    fireEvent.click(changelogButton);
    expect(screen.getByText("Welcome to Automated Review Companion (ARC)")).toBeInTheDocument();

    const changelogCloseButton = screen.getByLabelText('Close changelog');
    fireEvent.click(changelogCloseButton);
    expect(screen.queryByText("Welcome to Automated Review Companion (ARC)")).not.toBeInTheDocument();
  });
  
});
