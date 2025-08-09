import React, { useState } from 'react';
import { Card, Button, Row, Col, Tabs, List, Tag, Alert, Statistic, Avatar, Typography, Badge, Divider } from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  EyeOutlined, 
  EditOutlined, 
  StarOutlined, 
  StarFilled,
  BellOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Target,
  DollarSign,
  Package,
  Users
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface RecentScheme {
  id: string;
  name: string;
  lastRun: string;
  status: 'completed' | 'running' | 'draft';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isStarred: boolean;
  usageCount: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
  actionText: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  actionText: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  
  // 模拟数据
  const recentSchemes: RecentScheme[] = [
    {
      id: '1',
      name: '我的Q3 CPU价格回顾',
      lastRun: '2小时前',
      status: 'completed'
    },
    {
      id: '2', 
      name: '华东区供应商协议价分析',
      lastRun: '昨天',
      status: 'completed'
    },
    {
      id: '3',
      name: '内存条价格趋势分析',
      lastRun: '3天前',
      status: 'draft'
    }
  ];

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: '同产品与历史价格对比',
      description: '分析同一产品在不同时间段的价格变化趋势',
      category: '价格趋势',
      isStarred: true,
      usageCount: 156
    },
    {
      id: '2',
      name: '跨组织价格差异分析',
      description: '对比不同组织间同类产品的价格差异',
      category: '价格对比',
      isStarred: false,
      usageCount: 89
    },
    {
      id: '3',
      name: '协议价执行情况分析',
      description: '监控协议价格的执行情况和偏差',
      category: '协议监控',
      isStarred: true,
      usageCount: 234
    },
    {
      id: '4',
      name: '同类产品比价分析',
      description: '对同类产品进行全面的价格比较分析',
      category: '产品比价',
      isStarred: false,
      usageCount: 178
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: '价格异动预警',
      description: '物料 [CPU-i9-14900K] 的最新采购价(150元)较上月均价上涨超过15%',
      time: '10分钟前',
      actionText: '查看详情'
    },
    {
      id: '2',
      type: 'info',
      title: '协议到期提醒',
      description: '供应商 [供应商C] 的协议价将于 [2025-08-30] 到期，请及时处理',
      time: '1小时前',
      actionText: '去处理'
    }
  ];

  const insights: Insight[] = [
    {
      id: '1',
      title: '降本机会发现',
      description: '您常分析的 [内存条] 品类，发现 [供应商D] 的价格在过去一季度中持续最低',
      actionText: '生成对比报表',
      time: '2小时前'
    },
    {
      id: '2',
      title: '供应商表现分析',
      description: '供应商 [供应商A] 在 [显卡] 品类的价格稳定性表现优异，建议加强合作',
      actionText: '查看详细分析',
      time: '1天前'
    }
  ];

  const kpiData = {
    totalPurchase: {
      value: 12580000,
      change: 8.5,
      trend: 'up'
    },
    costSaving: {
      value: 1250000,
      change: 15.2,
      trend: 'up'
    },
    supplierCount: {
      value: 156,
      change: -2.1,
      trend: 'down'
    },
    agreementRate: {
      value: 94.5,
      change: 3.2,
      trend: 'up'
    }
  };

  const handleStartNewAnalysis = () => {
    console.log('开始新的比价分析');
  };

  const handleRunScheme = (schemeId: string) => {
    console.log('运行方案:', schemeId);
  };

  const handleViewReport = (schemeId: string) => {
    console.log('查看报表:', schemeId);
  };

  const handleEditScheme = (schemeId: string) => {
    console.log('编辑方案:', schemeId);
  };

  const handleUseTemplate = (templateId: string) => {
    console.log('使用模板:', templateId);
  };

  const handleToggleStar = (templateId: string) => {
    console.log('切换收藏:', templateId);
  };

  const renderStatusTag = (status: string) => {
    const statusConfig = {
      completed: { color: 'green', text: '已完成', icon: <CheckCircle className="h-3 w-3" /> },
      running: { color: 'blue', text: '运行中', icon: <Activity className="h-3 w-3" /> },
      draft: { color: 'orange', text: '草稿', icon: <Clock className="h-3 w-3" /> }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const renderAlertIcon = (type: string) => {
    const iconConfig = {
      warning: <AlertTriangle className="h-4 w-4" style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircle className="h-4 w-4" style={{ color: '#52c41a' }} />
    };
    return iconConfig[type as keyof typeof iconConfig];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="mb-2">智能比价分析平台</Title>
            <Text type="secondary">欢迎您，李经理</Text>
          </div>
          <div className="flex items-center space-x-4">
            <Badge count={3}>
              <Button icon={<BellOutlined />} shape="circle" />
            </Badge>
            <Avatar size="large">李</Avatar>
          </div>
        </div>
      </div>

      {/* 模块一：快速开始 */}
      {/* <Card className="mb-6" title={
        <div className="flex items-center space-x-2">
          <RiseOutlined className="text-blue-500" />
          <span>快速开始</span>
        </div>
      }>
        <div className="space-y-4">
          <div className="text-center py-4">
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              onClick={handleStartNewAnalysis}
              className="h-12 px-8 text-lg"
            >
              开始新的比价分析
            </Button>
          </div>
          
          <Divider>最近使用的方案</Divider>
          
          <List
            dataSource={recentSchemes}
            renderItem={(scheme) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleRunScheme(scheme.id)}
                  >
                    立即运行
                  </Button>,
                  <Button 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => handleViewReport(scheme.id)}
                  >
                    查看报表
                  </Button>,
                  <Button 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={() => handleEditScheme(scheme.id)}
                  >
                    编辑
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center space-x-2">
                      <span>{scheme.name}</span>
                      {renderStatusTag(scheme.status)}
                    </div>
                  }
                  description={`最后运行: ${scheme.lastRun}`}
                />
              </List.Item>
            )}
          />
        </div>
      </Card> */}

      {/* 模块二：我的工作区 */}
      <Card className="mb-6" title={
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-500" />
          <span>我的工作区</span>
        </div>
      }>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="常用报表模板" key="templates">
            <Row gutter={[16, 16]}>
              {reportTemplates.map((template) => (
                <Col xs={24} sm={12} lg={6} key={template.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        开始分析
                      </Button>,
                      <Button 
                        type="text" 
                        size="small"
                        icon={template.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                        onClick={() => handleToggleStar(template.id)}
                      >
                        {template.isStarred ? '已收藏' : '收藏'}
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{template.name}</span>
                          {template.isStarred && <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />}
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <Paragraph ellipsis={{ rows: 2 }} className="text-xs text-gray-600 mb-2">
                            {template.description}
                          </Paragraph>
                          <div className="flex justify-between items-center">
                            <Tag color="blue">{template.category}</Tag>
                            <Text type="secondary" className="text-xs">使用 {template.usageCount} 次</Text>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
          <TabPane tab="我的方案" key="schemes">
            <div className="text-center py-8">
              <Text type="secondary">暂无个人方案</Text>
            </div>
          </TabPane>
          <TabPane tab="我的收藏" key="favorites">
            <Row gutter={[16, 16]}>
              {reportTemplates.filter(t => t.isStarred).map((template) => (
                <Col xs={24} sm={12} lg={6} key={template.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        开始分析
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={<span className="text-sm font-medium">{template.name}</span>}
                      description={
                        <div className="space-y-2">
                          <Paragraph ellipsis={{ rows: 2 }} className="text-xs text-gray-600 mb-2">
                            {template.description}
                          </Paragraph>
                          <Tag color="blue">{template.category}</Tag>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 模块三：智能洞察与预警 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>智能洞察与预警</span>
              </div>
            }
            className="h-full"
          >
            <div className="space-y-4">
              {/* 价格异动预警 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <BellOutlined className="text-red-500" />
                  <Text strong>价格异动预警 ({alerts.length}条)</Text>
                </div>
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      type={alert.type as any}
                      showIcon
                      icon={renderAlertIcon(alert.type)}
                      message={
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{alert.description}</div>
                            <Text type="secondary" className="text-xs">{alert.time}</Text>
                          </div>
                          <Button type="link" size="small">{alert.actionText}</Button>
                        </div>
                      }
                    />
                  ))}
                </div>
              </div>

              <Divider />

              {/* 洞察推荐 */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <InfoCircleOutlined className="text-blue-500" />
                  <Text strong>洞察推荐</Text>
                </div>
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-blue-900 mb-1">{insight.title}</div>
                          <div className="text-sm text-blue-700 mb-2">{insight.description}</div>
                          <Text type="secondary" className="text-xs">{insight.time}</Text>
                        </div>
                        <Button type="primary" size="small" ghost>
                          {insight.actionText}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 模块四：关键指标概览 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span>关键指标概览</span>
              </div>
            }
            className="h-full"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="采购总额(月度)"
                    value={kpiData.totalPurchase.value}
                    precision={0}
                    valueStyle={{ color: kpiData.totalPurchase.trend === 'up' ? '#3f8600' : '#cf1322' }}
                    prefix={<DollarSign className="h-4 w-4" />}
                    suffix={
                      <div className="text-xs">
                        {kpiData.totalPurchase.trend === 'up' ? 
                          <RiseOutlined style={{ color: '#3f8600' }} /> : 
                          <FallOutlined style={{ color: '#cf1322' }} />
                        }
                        {Math.abs(kpiData.totalPurchase.change)}%
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="降本金额"
                    value={kpiData.costSaving.value}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<TrophyOutlined />}
                    suffix={
                      <div className="text-xs">
                        <RiseOutlined style={{ color: '#3f8600' }} />
                        {kpiData.costSaving.change}%
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="活跃供应商"
                    value={kpiData.supplierCount.value}
                    valueStyle={{ color: kpiData.supplierCount.trend === 'up' ? '#3f8600' : '#cf1322' }}
                    prefix={<Users className="h-4 w-4" />}
                    suffix={
                      <div className="text-xs">
                        {kpiData.supplierCount.trend === 'up' ? 
                          <RiseOutlined style={{ color: '#3f8600' }} /> : 
                          <FallOutlined style={{ color: '#cf1322' }} />
                        }
                        {Math.abs(kpiData.supplierCount.change)}%
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="协议执行率"
                    value={kpiData.agreementRate.value}
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<Package className="h-4 w-4" />}
                    suffix={
                      <div className="text-xs">
                        <RiseOutlined style={{ color: '#3f8600' }} />
                        {kpiData.agreementRate.change}%
                      </div>
                    }
                  />
                </Card>
              </Col>
            </Row>
            
            {/* 图表区域 */}
            <div className="mt-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="采购总额趋势">
                    <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <Text type="secondary" className="text-xs">柱状图/折线图</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="品类成本占比">
                    <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                      <div className="text-center">
                        <PieChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <Text type="secondary" className="text-xs">饼图/环形图</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;