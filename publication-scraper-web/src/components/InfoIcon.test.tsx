import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import InfoIcon from "./InfoIcon";

describe('Info Icon', () => {

  test('renders', () => {
    render(<InfoIcon tooltipPlacement='left' tooltipText='Click to view the info' />);
    const infoIcon = screen.getByTitle('Click to view the info');
    expect(infoIcon).toBeInTheDocument();
  });
  
});