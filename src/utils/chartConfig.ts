import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 默认配置
ChartJS.defaults.font.family = "'Inter', 'Noto Sans SC', sans-serif";
ChartJS.defaults.color = '#6B7280';
ChartJS.defaults.plugins.legend.display = true;
ChartJS.defaults.plugins.tooltip.enabled = true;
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

export default ChartJS;

