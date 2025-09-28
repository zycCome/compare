// Navigation items configuration
import {
  Database,
  BarChart3,
  Target,
  TrendingUp,
  Calculator,
  Activity,
  Layers,
  Grid3X3,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import DataModelManagement from "./pages/DataModelManagement";
import AnalysisSubject from "./pages/AnalysisSubject";
import DatasetManagement from "./pages/DatasetManagement";
import DimensionManagement from "./pages/DimensionManagement";
import MetricManagement from "./pages/MetricManagement";
import ReportCenter from "./pages/ReportCenter";
import PriceModelManagement  from "./pages/PriceModelManagement";
import PriceCompareRule from "./pages/PriceCompareRule";
import PriceSchemeManagement from "./pages/PriceSchemeManagement";
import PriceSchemeManagementV2 from "./pages/PriceSchemeManagementV2";
import ComparisonModelManagement from "./pages/ComparisonModelManagement";

export interface NavItem {
  title: string;
  to: string;
  icon: React.ReactElement;
  component: React.ComponentType;
}

/**
* Central place for defining the navigation items. Used for navigation components and routing.
*/
export const navItems: NavItem[] = [
{
    title: "工作台",
    to: "/",
    icon: <Activity className="h-4 w-4" />,
    component: Dashboard,
},
{
    title: "数据模型",
    to: "/data-model",
    icon: <Layers className="h-4 w-4" />,
    component: DataModelManagement,
},
{
    title: "分析主题",
    to: "/analysis-subject",
    icon: <BarChart3 className="h-4 w-4" />,
    component: AnalysisSubject,
},
{
    title: "数据集管理",
    to: "/dataset-management",
    icon: <Database className="h-4 w-4" />,
    component: DatasetManagement,
},
{
    title: "维度管理",
    to: "/dimension-management",
    icon: <Grid3X3 className="h-4 w-4" />,
    component: DimensionManagement,
},
{
    title: "指标管理",
    to: "/metric-management",
    icon: <Target className="h-4 w-4" />,
    component: MetricManagement,
},
{
    title: "比价模型",
    to: "/price-model",
    icon: <Calculator className="h-4 w-4" />,
    component: PriceModelManagement,
},
{
    title: "比价规则",
    to: "/price-comparison",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceCompareRule,
},
{
    title: "比价方案",
    to: "/price-scheme",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceSchemeManagement,
},
{
    title: "比价方案新版",
    to: "/price-scheme-v2",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceSchemeManagementV2,
},
{
    title: "比对模型",
    to: "/comparison-model",
    icon: <Calculator className="h-4 w-4" />,
    component: ComparisonModelManagement,
},
{
    title: "比价分析中心",
    to: "/report-center",
    icon: <BarChart3 className="h-4 w-4" />,
    component: ReportCenter,
},
];
