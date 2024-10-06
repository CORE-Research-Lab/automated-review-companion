import App from "@/App";
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

describe('Changelog Modal', () => {

  test('handles open and close of changelog', () => {
    render(<App />);
    
    const changelogButton = screen.getByLabelText('Click to view the changelog');
    fireEvent.click(changelogButton);
    expect(screen.getByText("Welcome to Automated Review Companion (ARC)")).toBeInTheDocument();

    const changelogCloseButton = screen.getByLabelText('Close changelog');
    fireEvent.click(changelogCloseButton);
    expect(screen.queryByText("Welcome to Automated Review Companion (ARC)")).not.toBeInTheDocument();
  });
  
});