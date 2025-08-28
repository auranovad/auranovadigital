// app/src/test/smoke.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Páginas bajo prueba (usa los alias configurados)
import Index from "@/pages/Index";
import Admin from "@/pages/Admin";
import AdminWizard from "@/pages/AdminWizard";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Smoke Tests — Basic Rendering", () => {
  it("renders Index page without crashing", () => {
    renderWithRouter(<Index />);
  });

  it("Admin page shows tenant status indicators", () => {
    renderWithRouter(<Admin />);

    // Hacemos las aserciones robustas frente a duplicados/etiquetas ocultas
    const required = [/Estado del Tenant/i, /Database/i, /API/i, /Cache/i];

    required.forEach((re) => {
      const matches = [
        ...screen.queryAllByRole("heading", { name: re }),
        ...screen.queryAllByText(re),
      ];
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it("renders AdminWizard page with setup wizard", () => {
    renderWithRouter(<AdminWizard />);
    // Basta con comprobar que hay al menos un heading
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
  });
});
