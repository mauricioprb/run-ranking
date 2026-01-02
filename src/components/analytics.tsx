"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Label,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { RankingItem } from "@/lib/data";

export function Analytics({ ranking }: { ranking: RankingItem[] }) {
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const fullMonths = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const monthlyDistance = new Array(12).fill(0);

  ranking.forEach((runner) => {
    runner.atividades.forEach((activity) => {
      const date = new Date(activity.data_inicio);
      const monthIndex = date.getUTCMonth();
      monthlyDistance[monthIndex] += activity.distancia / 1000;
    });
  });

  const radarData = months.map((month, index) => ({
    month,
    distance: Math.round(monthlyDistance[index]),
  }));

  const radarConfig = {
    distance: {
      label: "Distância (km)",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const buckets = {
    "3km": 0,
    "5km": 0,
    "10km": 0,
    "21km": 0,
    "42km": 0,
    Ultra: 0,
  };

  ranking.forEach((runner) => {
    runner.atividades.forEach((activity) => {
      const distKm = activity.distancia / 1000;
      if (distKm <= 3) buckets["3km"] += distKm;
      else if (distKm <= 5) buckets["5km"] += distKm;
      else if (distKm <= 10) buckets["10km"] += distKm;
      else if (distKm <= 21) buckets["21km"] += distKm;
      else if (distKm <= 42) buckets["42km"] += distKm;
      else buckets["Ultra"] += distKm;
    });
  });

  const pieData = [
    { range: "Até 3km", distance: Math.round(buckets["3km"]), fill: "var(--color-range-3km)" },
    { range: "3-5km", distance: Math.round(buckets["5km"]), fill: "var(--color-range-5km)" },
    { range: "5-10km", distance: Math.round(buckets["10km"]), fill: "var(--color-range-10km)" },
    { range: "10-21km", distance: Math.round(buckets["21km"]), fill: "var(--color-range-21km)" },
    { range: "21-42km", distance: Math.round(buckets["42km"]), fill: "var(--color-range-42km)" },
    { range: "+42km", distance: Math.round(buckets["Ultra"]), fill: "var(--color-range-ultra)" },
  ].filter((item) => item.distance > 0);

  const pieConfig = {
    distance: {
      label: "Distância Total",
    },
    "range-3km": {
      label: "Até 3km",
      color: "var(--chart-1)",
    },
    "range-5km": {
      label: "3-5km",
      color: "var(--chart-2)",
    },
    "range-10km": {
      label: "5-10km",
      color: "var(--chart-3)",
    },
    "range-21km": {
      label: "10-21km",
      color: "var(--chart-4)",
    },
    "range-42km": {
      label: "21-42km",
      color: "var(--chart-5)",
    },
    "range-ultra": {
      label: "+42km",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const totalDistance = React.useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.distance, 0);
  }, [pieData]);

  const maxMonthIndex = monthlyDistance.reduce(
    (maxIdx, curr, idx, arr) => (curr > arr[maxIdx] ? idx : maxIdx),
    0,
  );

  const top3 = ranking.slice(0, 3);
  const areaChartData = months.map((month, index) => {
    const dataPoint: any = { month };
    top3.forEach((runner, i) => {
      const runnerKey = `runner${i}`;
      let monthlyDist = 0;
      runner.atividades.forEach((activity) => {
        const date = new Date(activity.data_inicio);
        if (date.getUTCMonth() === index) {
          monthlyDist += activity.distancia / 1000;
        }
      });
      dataPoint[runnerKey] = Math.round(monthlyDist);
    });
    return dataPoint;
  });

  const areaChartConfig: ChartConfig = {};
  top3.forEach((runner, i) => {
    areaChartConfig[`runner${i}`] = {
      label: runner.nome.split(" ")[0],
      color: `var(--chart-${i + 1})`,
    };
  });

  if (ranking.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mb-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="items-center pb-4">
            <CardTitle>Volume Mensal</CardTitle>
            <CardDescription>Total de km percorridos por mês (Todos os atletas)</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[250px]">
              <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="month" />
                <PolarGrid />
                <Radar
                  dataKey="distance"
                  fill="var(--color-distance)"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Mês com maior volume: {fullMonths[maxMonthIndex]}
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Distribuição por Distância</CardTitle>
            <CardDescription>Km totais divididos por tipo de treino</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData}
                  dataKey="distance"
                  nameKey="range"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalDistance.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Km Totais
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Análise de volume por distância
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 3 Atletas - Evolução Mensal</CardTitle>
          <CardDescription>
            Comparativo de volume mensal entre os líderes do ranking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={areaChartData}>
              <defs>
                {top3.map((_, i) => (
                  <linearGradient key={i} id={`fillRunner${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-runner${i})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-runner${i})`} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              {top3.map((_, i) => (
                <Area
                  key={i}
                  dataKey={`runner${i}`}
                  type="natural"
                  fill={`url(#fillRunner${i})`}
                  stroke={`var(--color-runner${i})`}
                  stackId="a"
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
