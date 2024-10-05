import App from "@/App";
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Changelog Modal', () => {

  test('handles open and close of changelog', () => {
    render(<App />);
    
    const changelogButton = screen.getByLabelText('Click to view the changelog');
    fireEvent.click(changelogButton);
    expect(screen.getByText(/Changelog/)).toBeInTheDocument();

    const changelogCloseButton = screen.getByLabelText('Close changelog');
    fireEvent.click(changelogCloseButton);
    expect(screen.queryByText(/Changelog/)).not.toBeInTheDocument();
  });
  
});