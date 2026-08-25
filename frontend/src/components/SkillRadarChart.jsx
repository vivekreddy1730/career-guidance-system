import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SkillRadarChart({ scoreReport = {} }) {
  const labels = Object.keys(scoreReport);
  const values = Object.values(scoreReport);

  if (labels.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 text-muted-dark">
        No assessment data yet
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Your Skill Scores",
        data: values,
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        borderColor: "#6366f1",
        borderWidth: 2,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#6366f1",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#94a3b8", font: { family: "Inter" } },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: "#64748b",
          backdropColor: "transparent",
        },
        grid: { color: "rgba(99, 102, 241, 0.1)" },
        pointLabels: {
          color: "#94a3b8",
          font: { family: "Inter", size: 11 },
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
