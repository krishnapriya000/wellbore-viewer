import '@/shared/lib/r3fCompat';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/theme/tokens.css';
import '@/shared/theme/app.css';

/**
 * Start-up order matters:
 *  1. validate configuration (a bad .env fails here with a readable message),
 *  2. initialise MSAL and handle the redirect response BEFORE React renders — otherwise the first
 *     render sees no account and starts a second sign-in,
 *  3. render.
 * Everything is imported inside the try so any start-up failure shows a message, not a blank page.
 */
async function bootstrap() {
  const root = document.getElementById('root')!;
  try {
    const { env } = await import('@/shared/config/env');
    const auth =
      env.VITE_AUTH_MODE === 'mock'
        ? (await import('@/shared/auth')).createMockAuth(env.VITE_MOCK_ROLE)
        : await (await import('@/shared/auth/entraAuth')).createEntraAuth(env);
    const [{ App }, { Providers }] = await Promise.all([import('@/app/App'), import('@/app/Providers')]);

    createRoot(root).render(
      <StrictMode>
        <Providers auth={auth}>
          <App />
        </Providers>
      </StrictMode>,
    );
  } catch (error) {
    console.error(error);
    const p = document.createElement('p');
    p.className = 'gate-msg';
    p.setAttribute('role', 'alert');
    p.textContent = import.meta.env.DEV
      ? String(error instanceof Error ? error.message : error)
      : 'The application could not start. Please try again or contact support.';
    root.replaceChildren(p);
  }
}

void bootstrap();
