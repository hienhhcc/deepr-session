"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStat } from "../../../shared/types/analytics";

interface FocusChartProps {
  data: DailyStat[];
}

function formatXAxisDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FocusChart({ data }: FocusChartProps) {
  return (
    <Card className="card-hover-lift">
      <CardHeader>
        <CardTitle className="text-base">Daily Focus (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No focus data yet. Complete a session to see your chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.5200 0.0400 150.0000 / 0.15)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisDate}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="oklch(0.5200 0.0400 150.0000)"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="oklch(0.5200 0.0400 150.0000)"
                label={{
                  value: "Minutes",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontSize: 12,
                    fill: "oklch(0.5200 0.0400 150.0000)",
                  },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.9867 0.0046 80.7211)",
                  border: "1px solid oklch(0.8700 0.0200 100.0000)",
                  borderRadius: "12px",
                  fontSize: 13,
                  boxShadow:
                    "0 4px 16px oklch(0.0000 0.0000 0.0000 / 0.08), 0 1px 4px oklch(0.0000 0.0000 0.0000 / 0.04)",
                  padding: "8px 12px",
                }}
                labelFormatter={formatXAxisDate}
                formatter={(value: number) => [`${value} min`, "Focus"]}
                cursor={{ fill: "oklch(0.5234 0.1347 144.1672 / 0.06)" }}
              />
              <Bar
                dataKey="totalFocusMinutes"
                fill="oklch(0.5234 0.1347 144.1672)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
