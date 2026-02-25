import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const RadarChart = () => {
  // Label Wrapping Logic (16 chars) - simplified for React
  const labels = ['박식함 자랑', '무지의 인정', '예리한 통찰', '경박한 자랑', '풍부한 경험'];

  const data = {
    labels: labels,
    datasets: [
      {
        label: '지혜 (Wisdom)',
        data: [20, 95, 90, 10, 85],
        backgroundColor: 'rgba(93, 109, 95, 0.2)',
        borderColor: '#5D6D5F',
        borderWidth: 2,
      },
      {
        label: '지식 (Knowledge)',
        data: [90, 10, 40, 95, 20],
        backgroundColor: 'rgba(212, 163, 115, 0.2)',
        borderColor: '#D4A373',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      r: { beginAtZero: true, max: 100, ticks: { display: false } },
    },
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto h-[300px] max-h-[350px]">
      <Radar data={data} options={options} />
    </div>
  );
};

export const BarChart = () => {
  const data = {
    labels: ['리더의 먼 길', '회원의 지름길'],
    datasets: [
      {
        label: '위험 지수 (Risk)',
        data: [20, 95],
        backgroundColor: '#B07D62',
      },
      {
        label: '생존 확률 (Survival)',
        data: [98, 5],
        backgroundColor: '#5D6D5F',
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto h-[300px] max-h-[350px]">
      <Bar data={data} options={options} />
    </div>
  );
};
