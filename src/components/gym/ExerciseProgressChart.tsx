"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface DataPoint {
  date: string;       // YYYY-MM-DD
  bestWeight: number; // kg
  bestReps: number;
}

interface Props {
  exerciseName: string;
  data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DataPoint;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-xs shadow-sm">
      <p className="text-muted-foreground mb-1">
        {format(parseISO(d.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
      </p>
      <p className="font-semibold text-foreground">
        {d.bestWeight} kg × {d.bestReps} reps
      </p>
    </div>
  );
}

export function ExerciseProgressChart({ exerciseName, data }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground italic">
        Necesitás al menos 2 sesiones para ver el progreso
      </div>
    );
  }

  const minW = Math.min(...data.map((d) => d.bestWeight));
  const maxW = Math.max(...data.map((d) => d.bestWeight));
  const padding = (maxW - minW) * 0.2 || 1;

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(36 20% 76% / 0.6)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "hsl(30 22% 43%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => format(parseISO(v), "d MMM", { locale: es })}
          />
          <YAxis
            domain={[minW - padding, maxW + padding]}
            tick={{ fontSize: 9, fill: "hsl(30 22% 43%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="bestWeight"
            stroke="#3D5C30"
            strokeWidth={1.5}
            dot={{ fill: "#3D5C30", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "#3D5C30" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
