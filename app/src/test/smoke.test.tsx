import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import Index from '../pages/Index';
import Admin from '../pages/Admin';
import AdminWizard from '../pages/AdminWizard';

// Helper to wrap components with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Smoke Tests - Basic Rendering', () => {
  it('renders Index page without crashing', () => {
    const { getByText } = renderWithRouter(<Index />);
    expect(getByText(/AuraNovaDigital/i)).toBeInTheDocument();
    expect(getByText(/Plataforma empresarial moderna/i)).toBeInTheDocument();
  });

  it('renders Admin page with tenant status', () => {
    const { getByText } = renderWithRouter(<Admin />);
    expect(getByText(/Estado del Tenant/i)).toBeInTheDocument();
    expect(getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  it('renders AdminWizard page with setup wizard', () => {
    const { getByText } = renderWithRouter(<AdminWizard />);
    expect(getByText(/Setup Wizard/i)).toBeInTheDocument();
    expect(getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it('Admin page shows all required status indicators', () => {
    const { getByText } = renderWithRouter(<Admin />);
    expect(getByText(/Database/i)).toBeInTheDocument();
    expect(getByText(/API/i)).toBeInTheDocument();
    expect(getByText(/Cache/i)).toBeInTheDocument();
    expect(getByText(/CDN/i)).toBeInTheDocument();
  });

  it('AdminWizard has form inputs on step 1', () => {
    const { getByLabelText } = renderWithRouter(<AdminWizard />);
    expect(getByLabelText(/Tenant Name/i)).toBeInTheDocument();
    expect(getByLabelText(/Admin Email/i)).toBeInTheDocument();
  });
});