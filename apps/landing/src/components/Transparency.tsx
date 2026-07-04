import { CountUp, Reveal, Scramble } from "./motion";
import { ComunaTerrain3D, type ComunaDatum } from "./ComunaTerrain3D";

const SECRETARIAS = [
  { code: "SINF", name: "Infraestructura", count: 1284, pct: 92 },
  { code: "SMOV", name: "Movilidad", count: 987, pct: 71 },
  { code: "SSAL", name: "Salud", count: 642, pct: 46 },
  { code: "SEDU", name: "Educación", count: 511, pct: 37 },
  { code: "SAMB", name: "Medio Ambiente", count: 398, pct: 29 },
];

const COMUNAS: ComunaDatum[] = [
  { id: "1", name: "Popular", intensity: 18 },
  { id: "10", name: "La Candelaria", intensity: 38 },
  { id: "11", name: "Laureles-Estadio", intensity: 64 },
  { id: "14", name: "El Poblado", intensity: 27 },
  { id: "16", name: "Belén", intensity: 41 },
];

const STATS: { k: string; value: number; suffix?: string; grouping?: boolean }[] = [
  { k: "PQRs / mes", value: 3822 },
  { k: "SLA cumplido", value: 94, suffix: "%", grouping: false },
  { k: "Comunas", value: 16, suffix: "/16", grouping: false },
];

const BULLETS = [
  "Mapa por comuna y corregimiento",
  "Línea temporal por tipo de PQR",
  "Top secretarías por volumen y SLA",
  "Tasa de respuesta dentro del plazo legal",
];

export function Transparency() {
  return (
    <section id="transparencia" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal className="eyebrow">// transparencia pública</Reveal>
            <Reveal
              as="h2"
              delay={60}
              className="mt-3 text-balance text-display font-semibold tracking-tight"
            >
              Abra los datos a la ciudadanía,{" "}
              <span className="font-serif-italic text-primary">sin riesgo.</span>
            </Reveal>
            <Reveal as="p" delay={120} className="mt-5 text-muted-foreground">
              k-anonymity ≥ 5 aplicado en base de datos. Sin PII, sin nombres, sin direcciones. La
              ciudadanía ve agregados; la auditoría ve el detalle.
            </Reveal>
            <ul className="mt-6 space-y-2.5 text-sm">
              {BULLETS.map((b, i) => (
                <Reveal as="li" key={b} delay={180 + i * 70} className="flex items-start gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 shrink-0 text-primary"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-foreground/90">{b}</span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={480}>
              <a
                href="#demo"
                className="sheen mt-8 inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
              >
                Ver demo de transparencia
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </Reveal>
          </div>

          <Reveal
            as="div"
            y={28}
            className="panel-glass sheen relative rounded-2xl p-5"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <Scramble text="transparencia.medellin.gov.co" />
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />k ≥ 5
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div key={s.k} className="rounded-xl border border-hairline bg-background/40 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.k}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-primary">
                    <CountUp value={s.value} suffix={s.suffix} grouping={s.grouping ?? true} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Top secretarías
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  volumen
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                {SECRETARIAS.map((s, i) => (
                  <div key={s.code} className="flex items-center gap-3">
                    <span className="w-12 font-mono text-[11px] text-muted-foreground">
                      {s.code}
                    </span>
                    <span className="w-32 truncate text-xs text-foreground/90">{s.name}</span>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-background/60">
                      <div
                        className="bar-fill absolute inset-y-0 left-0 rounded-full bg-primary"
                        style={{ width: `${s.pct}%`, ["--bar-i" as string]: i }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-[11px] tabular-nums text-foreground">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Intensidad por comuna
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary/80">
                  vista 3D
                </div>
              </div>
              <ComunaTerrain3D data={COMUNAS} />
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>menos PQRs</span>
                <span>más PQRs</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
