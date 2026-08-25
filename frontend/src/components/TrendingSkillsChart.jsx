import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export function TrendingSkillsDoughnut({ skills = [] }) {
  const data = {
    labels: skills.map((s) => s.skill),
    datasets: [
      {
        data: skills.map((s) => s.demand),
        backgroundColor: skills.map((s) => s.color || "#6366f1"),
        borderColor: "var(--bg-dark)",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#94a3b8",
          font: { family: "Inter", size: 11 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const skill = skills[ctx.dataIndex];
            return ` Demand: ${ctx.parsed}% (${skill?.growth || ""})`;
          },
        },
      },
    },
    cutout: "65%",
  };

  return <Doughnut data={data} options={options} />;
}

export function TrendingSkillsBar({ skills = [] }) {
  const data = {
    labels: skills.map((s) => s.skill),
    datasets: [
      {
        label: "Market Demand (%)",
        data: skills.map((s) => s.demand),
        backgroundColor: skills.map((s) => s.color || "#6366f1"),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        max: 100,
        ticks: { color: "#64748b" },
        grid: { color: "rgba(99,102,241,0.07)" },
      },
      y: {
        ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
        grid: { display: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
