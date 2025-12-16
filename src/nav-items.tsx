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
  Table,
  FileText,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import DataModelManagement from "./pages/DataModelManagement";
import AnalysisSubject from "./pages/AnalysisSubject";
import AnalysisSubjectV2 from "./pages/AnalysisSubjectV2";
import DatasetManagement from "./pages/DatasetManagement";
import DimensionManagement from "./pages/DimensionManagement";
import MetricManagement from "./pages/MetricManagement";
import ReportCenter from "./pages/ReportCenter";
import ReportPublish from "./pages/ReportPublish";
import PriceModelManagement  from "./pages/PriceModelManagement";
import PriceCompareRule from "./pages/PriceCompareRule";
import PriceSchemeManagement from "./pages/PriceSchemeManagement";
import PriceSchemeManagementV2 from "./pages/PriceSchemeManagementV2";
import ComparisonModelManagement from "./pages/ComparisonModelManagement";
import ComparisonModelManagementV2 from "./pages/ComparisonModelManagementV2";
import PriceComparisonReports from "./pages/PriceComparisonReports";
import MonitoringManagement from "./pages/MonitoringManagement";


export interface NavItem {
  title: string;
  to: string;
  icon: React.ReactElement;
  component: React.ComponentType;
  group?: '一期' | '二期';
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
    group: "一期",
},
{
    title: "数据模型",
    to: "/data-model",
    icon: <Layers className="h-4 w-4" />,
    component: DataModelManagement,
    group: "一期",
},
{
    title: "分析主题",
    to: "/analysis-subject",
    icon: <BarChart3 className="h-4 w-4" />,
    component: AnalysisSubject,
    group: "一期",
},
{
    title: "数据集管理",
    to: "/analysis-subject-v2",
    icon: <BarChart3 className="h-4 w-4" />,
    component: AnalysisSubjectV2,
    group: "二期",
},
{
    title: "数据集管理",
    to: "/dataset-management",
    icon: <Database className="h-4 w-4" />,
    component: DatasetManagement,
    group: "一期",
},
{
    title: "维度管理",
    to: "/dimension-management",
    icon: <Grid3X3 className="h-4 w-4" />,
    component: DimensionManagement,
    group: "一期",
},
{
    title: "指标管理",
    to: "/metric-management",
    icon: <Target className="h-4 w-4" />,
    component: MetricManagement,
    group: "一期",
},
{
    title: "比价模型",
    to: "/price-model",
    icon: <Calculator className="h-4 w-4" />,
    component: PriceModelManagement,
    group: "一期",
},
{
    title: "比价规则",
    to: "/price-comparison-rules",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceCompareRule,
    group: "一期",
},
{
    title: "比价方案",
    to: "/price-scheme",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceSchemeManagement,
    group: "一期",
},
{
    title: "比对模型",
    to: "/comparison-model",
    icon: <Calculator className="h-4 w-4" />,
    component: ComparisonModelManagement,
    group: "二期",
},
{
    title: "比价方案新版",
    to: "/price-scheme-v2",
    icon: <TrendingUp className="h-4 w-4" />,
    component: PriceSchemeManagementV2,
    group: "二期",
},
{
    title: "比对模型(卡片布局)",
    to: "/comparison-model-v2",
    icon: <Calculator className="h-4 w-4" />,
    component: ComparisonModelManagementV2,
    group: "一期",
},
{
    title: "比价分析中心",
    to: "/report-center",
    icon: <BarChart3 className="h-4 w-4" />,
    component: ReportCenter,
    group: "一期",
},
{
    title: "发布报表",
    to: "/report-publish",
    icon: <Table className="h-4 w-4" />,
    component: ReportPublish,
    group: "二期",
},
{
    title: "报表中心",
    to: "/report-center-v2",
    icon: <FileText className="h-4 w-4" />,
    component: PriceComparisonReports,
    group: "二期",
},
{
    title: "比价监控",
    to: "/monitoring-management",
    icon: <Activity className="h-4 w-4" />,
    component: MonitoringManagement,
    group: "二期",
},
];
