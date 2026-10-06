import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@planner/ui';
import '@planner/ui/styles';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
