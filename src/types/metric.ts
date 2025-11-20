// 指标配置接口
export interface MetricConfig {
  groupEnabled: boolean;
  groupName: string;
  attributes: string[];
  independentGroup: boolean;
  associationEnabled?: boolean; // 计算指标的关联展示功能
  associationTargetId?: string; // 关联的目标指标ID（用于计算指标）
}

// 指标配置弹窗属性
export interface MetricConfigDialogProps {
  open: boolean;
  item: {
    id: string;
    name: string;
    type: 'metric' | 'calculated' | 'baseline';
    metricConfig?: MetricConfig;
  };
  availableFields: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  onSave: (config: MetricConfig) => void;
  onClose: () => void;
}

// 扩展的报表项接口（用于 ReportPublish 组件）
export interface EnhancedDroppedItem {
  id: string;
  name: string;
  type: 'comparison' | 'dimension' | 'metric' | 'calculated' | 'baseline';
  category?: string;
  description?: string;
  position: 'row' | 'column' | 'value';
  metricConfig?: MetricConfig;
}