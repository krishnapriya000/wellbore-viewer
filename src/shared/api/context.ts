import { createContext } from 'react';
import type { ApiClient } from './http';

export const ApiContext = createContext<ApiClient | null>(null);
