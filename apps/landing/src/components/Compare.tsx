import { CountUp, Reveal } from "./motion";

const ROWS: [string, string, string][] = [
  ["Radicación", "Captura manual en Mercurio", "Intake automático desde web, correo, n8n"],
  [
    "Plazos legales",
    "Conteo a mano, sin alertas",
    "Motor de días hábiles colombianos (Ley Emiliani)",
  ],
  ["Tutelas", "Aparecen sin aviso previo", "Alertas tempranas de riesgo de tutela"],
  [
    "Trazabilidad",
    "Hojas de cálculo y correos sueltos",
    "Auditoría inmutable append-only por fila",
  ],
  [
    "Clasificación",
    "Funcionario lee y deriva a mano",
    "26 secretarías + 16 comunas, asistido por IA",
  ],
  ["Patrones", "Problemas recurrentes invisibles", "Problem Groups por similitud + territorio"],
  [
    "Habeas data",
    "PII expuesto en correos internos",
    "Ley 1581/2012 aplicada al texto, RLS multi-tenant",
  ],
  ["Transparencia", "Informes anuales en PDF", "Dashboard público con k-anonymity ≥ 5"],
];

const METRICS: { value: number; suffix?: string; grouping?: boolean; label: string }[] = [
  { value: 26, label: "Secretarías oficiales" },
  { value: 16, label: "Comunas y corregimientos" },
  { value: 6, label: "Tipos de PQRSD" },
  { value: 100, suffix: "%", label: "Trazable · append-only" },
];

export function Compare() {
  return (
    <section id="comparacion" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal className="eyebrow">// sin CAROL vs con CAROL</Reveal>
          <Reveal
            as="h2"
            delay={60}
            className="mt-3 text-balance text-display font-semibold tracking-tight"
          >
            La diferencia entre apagar incendios{" "}
            <span className="font-serif-italic text-primary">y operar con datos.</span>
          </Reveal>
        </div>

        <Reveal
          as="div"
          delay={80}
          className="mt-12 overflow-hidden rounded-2xl border border-hairline bg-surface/60 shadow-card"
        >
          <div className="grid grid-cols-12 border-b border-hairline bg-background/40 px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <div className="col-span-4">Capacidad</div>
            <div className="col-span-4">Sin CAROL</div>
            <div className="col-span-4 text-primary">Con CAROL</div>
          </div>
          {ROWS.map((row, i) => (
            <Reveal
              key={row[0]}
              as="div"
              y={14}
              delay={120 + i * 55}
              className={`grid grid-cols-12 px-6 py-5 text-sm ${i % 2 === 1 ? "bg-background/20" : ""}`}
            >
              <div className="col-span-4 font-medium text-foreground">{row[0]}</div>
              <div className="col-span-4 flex items-start gap-2 text-muted-foreground">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0 text-destructive/80"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                {row[1]}
              </div>
              <div className="col-span-4 flex items-start gap-2 text-foreground">
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
                {row[2]}
              </div>
            </Reveal>
          ))}
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal
              key={m.label}
              delay={i * 90}
              className="bg-surface/60 px-5 py-6 text-center"
            >
              <div className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                <CountUp value={m.value} suffix={m.suffix} grouping={m.grouping ?? true} />
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {m.label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
