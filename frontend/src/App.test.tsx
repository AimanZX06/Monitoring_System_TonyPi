import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the TonyPi heading', () => {
    render(<App />);
    expect(screen.getByText('TonyPi - Clean App Component')).toBeInTheDocument();
  });

  it('renders informational text', () => {
    render(<App />);
    expect(screen.getByText(/This App.tsx is now clean/i)).toBeInTheDocument();
  });
});