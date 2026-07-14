import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import routes from './routes';

export function entry() {
  hydrateRoot(document, <RouterProvider router={routes} />);
}
