import { useContext } from 'react';
import { ApiContext } from './context';
import type { ApiClient } from './http';

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApi must be used inside <ApiProvider>.');
  return client;
}
