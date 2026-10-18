import params from "../logo-params.json";

type Props = { size?: number; className?: string; title?: string };

/** Roco.bank pinwheel mark — six tangentially offset bars, geometry least-squares fitted to the
 *  header logo of the reference (scripts/assets/fit_logo.py, rms 0.042). */
export function LogoMark({ size = 40, className, title }: Props) {
  const L = params.bar_length;
  const W = params.bar_width;
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      {params.bars_viewbox40.map((b, i) => (
        <rect
          key={i}
          x={b.cx - L / 2}
          y={b.cy - W / 2}
          width={L}
          height={W}
          rx={0.5}
          transform={`rotate(${b.angle} ${b.cx} ${b.cy})`}
        />
      ))}
    </svg>
  );
}
