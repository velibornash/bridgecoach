import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

/**
 * Renders a component wrapped in the minimal providers needed by the app
 * (theme + toast host). Keeps integration tests realistic.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, options);
}
