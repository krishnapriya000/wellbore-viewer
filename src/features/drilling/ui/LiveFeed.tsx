import { useDrilling } from '../model/drillingStore';

/** Last four drilling messages. The feed array changes only when the bit passes something. */
export function LiveFeed() {
  const feed = useDrilling((s) => s.feed);
  return (
    <div className="hud feed" aria-live="polite" aria-label="Drilling feed">
      {feed.map((f) => (
        <div key={f.id} className={f.kind}>
          {f.text}
        </div>
      ))}
    </div>
  );
}
