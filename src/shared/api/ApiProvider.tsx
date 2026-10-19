import type { ReactNode } from 'react';
import { ApiContext } from './context';
import type { ApiClient } from './http';

export function ApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}
