import { useAuth } from '@/shared/auth';
import { useSettings, type ThemePref } from '@/shared/settings/settingsStore';
import { Segmented } from '@/shared/ui/Segmented';
import type { DepthUnit } from '@/shared/units/units';

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { unit, setUnit, theme, setTheme } = useSettings();
  const topRole = user?.roles.at(-1)?.replace('Wellbore.', '') ?? 'No role';

  return (
    <header className="app-header">
      <strong className="brand-name">Wellbore Viewer</strong>
      <div className="header-tools">
        <Segmented<DepthUnit>
          label="Depth unit"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'ft', label: 'ft' },
            { value: 'm', label: 'm' },
          ]}
        />
        <Segmented<ThemePref>
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'Auto' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        {user && (
          <span className="user" title={user.username}>
            {user.name} <span className="pill idle">{topRole}</span>
          </span>
        )}
        <button className="btn small" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
