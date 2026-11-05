export function McmExplanation() {
  return (
    <div className="block">
      <details>
        <summary>Minimum curvature method</summary>
        <div className="eq">
{`β  = acos[cos(I₂−I₁) − sin I₁·sin I₂·(1−cos(A₂−A₁))]
RF = (2/β)·tan(β/2)        (RF = 1 when β = 0)
ΔN   = ΔMD/2·(sin I₁ cos A₁ + sin I₂ cos A₂)·RF
ΔE   = ΔMD/2·(sin I₁ sin A₁ + sin I₂ sin A₂)·RF
ΔTVD = ΔMD/2·(cos I₁ + cos I₂)·RF
DLS  = β(°)·100 / ΔMD       (°/100 ft)`}
        </div>
        <p className="hint-text" style={{ marginTop: '8px' }}>
          The bore between surveys is drawn as the exact circular arc the method assumes. Plan builds at 3.0, 2.5 and 2.0 °/100 ft; the simulated actual is capped at 3.0 °/100 ft, so it lags the plan where steering runs out.
        </p>
      </details>
    </div>
  );
}

