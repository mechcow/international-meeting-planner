import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { TimezoneProvider } from '../context/TimezoneContext';

// Custom render that wraps components with providers
function AllProviders({ children }: { children: React.ReactNode }) {
  return <TimezoneProvider>{children}</TimezoneProvider>;
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
