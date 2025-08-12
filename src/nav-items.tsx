// Navigation items configuration
import {
  Home,
  Database,
  BarChart3,
  Settings,
  FileText,
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
// import ReportManagement from "./pages/ReportManagement";
import PriceModelManagement from "./pages/PriceModelManagement";
import PriceSchemeManagement from "./pages/PriceSchemeManagement";
import ReportCenter from "./pages/ReportCenter";
import { default as PriceModel2Management } from "./pages/PriceModel2Management";
import PriceCompareRule from "./pages/PriceCompareRule";
import PriceScheme2Management from "./pages/PriceScheme2Management";

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
// {
//     title: "报表管理",
//     to: "/report-management",
//     icon: <BarChart3 className="h-4 w-4" />,
//     component: ReportManagement,
// },
{
    title: "比价模型",
    to: "/price-model",
    icon: <Settings className="h-4 w-4" />,
    component: PriceModelManagement,
},
{
    title: "比价方案",
    to: "/price-scheme",
    icon: <FileText className="h-4 w-4" />,
    component: PriceSchemeManagement,
},
{
    title: "比价分析中心",
    to: "/report-center",
    icon: <BarChart3 className="h-4 w-4" />,
    component: ReportCenter,
},
{
    title: "比价模型2",
    to: "/price-model-2",
    icon: <Calculator className="h-4 w-4" />,
    component: PriceModel2Management,
},
{
    title: "比价规则",
    to: "/price-comparison",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceCompareRule,
},
{
    title: "比价方案2",
    to: "/price-scheme-2",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceScheme2Management,
},
];
