-- 分析主题表
CREATE TABLE `dmp_analysis_subject` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `subject_no` varchar(100) NOT NULL COMMENT '分析主题唯一标识，系统默认生成',
  `subject_name` varchar(200) NOT NULL COMMENT '分析主题名称',
  `description` varchar(500) DEFAULT NULL COMMENT '分析主题描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_enterprise_subject_name` (`enterprise_no`,`subject_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分析主题表';

-- 数据模型表
CREATE TABLE `dmp_data_model` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `model_code` varchar(100) NOT NULL COMMENT '数据模型编码',
  `model_name` varchar(200) NOT NULL COMMENT '数据模型名称',
  `source_type` enum('DORIS','MYSQL') NOT NULL DEFAULT 'DORIS' COMMENT '数据源类型：doris/mysql',
  `source_db` varchar(100) DEFAULT NULL COMMENT '数据库',
  `source_table` varchar(255) NOT NULL COMMENT '模型来源表名',
  `model_type` enum('fact','dimension','enum') DEFAULT 'fact' COMMENT '模型类型：fact-事实表，dimension-维度表，enum-枚举表',
  `description` varchar(500) DEFAULT NULL COMMENT '模型描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据模型表';

-- 模型字段表
CREATE TABLE `dmp_data_model_field` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `model_code` varchar(100) NOT NULL COMMENT '所属模型编码',
  `field_code` varchar(100) NOT NULL COMMENT '字段编码',
  `field_name` varchar(200) NOT NULL COMMENT '字段显示名称',
  `data_type` varchar(50) NOT NULL COMMENT '字段数据类型',
  `date_format` varchar(50) DEFAULT NULL COMMENT '日期格式',
  `length` bigint(20) DEFAULT NULL COMMENT '字段长度',
  `num_precision` int(11) DEFAULT NULL COMMENT '数值精度',
  `num_scale` int(11) DEFAULT NULL COMMENT '数值小数位',
  `nullable` tinyint(1) DEFAULT NULL COMMENT '是否允许为空',
  `is_primary_key` tinyint(4) DEFAULT '0' COMMENT '是否主键字段',
  `is_foreign_key` tinyint(4) DEFAULT '0' COMMENT '是否外键字段',
  `description` varchar(500) DEFAULT NULL COMMENT '字段描述',
  `field_type` enum('DIMENSION','MEASURE') NOT NULL COMMENT '字段类型：维度/度量',
  `is_metric` tinyint(4) DEFAULT '0' COMMENT '是否为业务指标（可选）',
  `expression` text COMMENT '字段表达式（可选）',
  `origin_field_table` varchar(255) NOT NULL COMMENT '字段原始来源表，用于血缘追溯(可选)',
  `origin_field_code` varchar(100) NOT NULL COMMENT '字段原始来源表字段，用于血缘追溯(可选)',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据模型字段表';

-- 模型字段血缘关系表
CREATE TABLE `dmp_data_model_field_lineage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `model_code` varchar(100) NOT NULL COMMENT '所属模型编码',
  `field_code` varchar(100) NOT NULL COMMENT '字段编码',
  `origin_field_table` varchar(255) NOT NULL COMMENT '字段原始来源表，用于血缘追溯(可选)',
  `origin_field_code` varchar(100) NOT NULL COMMENT '字段原始来源表字段，用于血缘追溯(可选)',
  `is_expression` tinyint(2) DEFAULT '0' COMMENT '是否为表达式字段',
  `expression` text COMMENT '字段表达式（可选,如price*num）',
  `lineage_json` json DEFAULT NULL COMMENT '血缘路径 JSON数组',
  `lineage_depth` int(10) DEFAULT '0' COMMENT '字段血缘深度（最长路径深度）',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型字段血缘关系表(可选)';

-- 数据集定义表
CREATE TABLE `dmp_dataset` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `dataset_code` varchar(100) NOT NULL COMMENT '数据集编码',
  `dataset_name` varchar(200) NOT NULL COMMENT '数据集名称',
  `source_type` enum('MODEL','EXCEL','API','SQL') NOT NULL DEFAULT 'MODEL' COMMENT '数据来源类型：数据模型/Excel/API接口/原始SQL',
  `query_sql` text COMMENT '数据集sql，当数据来源类型是sql时必填，如虚拟宽表',
  `api_url` text COMMENT 'api地址，当数据来源类型是api时必填',
  `excel_file_url` text COMMENT 'excel文件服务器存储地址，当数据来源类型是excel时必填',
  `description` varchar(500) DEFAULT NULL COMMENT '数据集描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据集表';

-- 数据集模型关联表
CREATE TABLE `dmp_dataset_model_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `main_model_code` varchar(100) NOT NULL COMMENT '主表模型编码',
  `sub_model_code` varchar(100) NOT NULL COMMENT '关联表模型编码',
  `main_field_code` varchar(100) NOT NULL COMMENT '主表连接字段（field_code）',
  `sub_field_code` varchar(100) NOT NULL COMMENT '子表连接字段（field_code）',
  `join_type` enum('INNER','LEFT','RIGHT') DEFAULT 'LEFT' COMMENT '表连接类型',
  `join_condition` text COMMENT '高级连接表达式（可选，用于特殊 join）',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据集模型关联表';

-- 数据集字段表
CREATE TABLE `dmp_dataset_field` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `model_code` varchar(100) NOT NULL COMMENT '来源模型编码',
  `model_field_code` varchar(100) NOT NULL COMMENT '引用的模型字段编码',
  `field_alias` varchar(200) DEFAULT NULL COMMENT '字段显示别名',
  `is_metric` tinyint(4) DEFAULT '0' COMMENT '是否为指标字段',
  `is_dimension` tinyint(4) DEFAULT '0' COMMENT '是否为维度字段',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据集字段表';



-- 指标定义表
CREATE TABLE `dmp_metric` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `metric_code` varchar(100) NOT NULL COMMENT '指标编码',
  `metric_name` varchar(200) NOT NULL COMMENT '指标名称',
  `metric_expr` text NOT NULL COMMENT '指标计算表达式',
  `agg_func` varchar(50) NOT NULL COMMENT '聚合函数，如SUM/AVG/COUNT/MAX/MIN等',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位，如元、次等',
  `is_public` tinyint(4) DEFAULT '0' COMMENT '是否为公共指标',
  `metric_type` enum('COMMON','CUSTOM') DEFAULT 'COMMON' COMMENT '指标类型：通用/自定义',
  `description` varchar(500) DEFAULT NULL COMMENT '指标描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标准指标定义表：统一管理全局指标表达式';

-- 维度定义表
CREATE TABLE `dmp_dimension` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `dimension_code` varchar(100) NOT NULL COMMENT '维度编码',
  `dimension_name` varchar(200) NOT NULL COMMENT '维度名称',
  `dimension_category` varchar(100) DEFAULT NULL COMMENT '维度分类（如：时间、组织、产品）',
  `level` int(11) DEFAULT '1' COMMENT '维度层级（如：省市区）',
  `parent_dimension_code` varchar(100) DEFAULT NULL COMMENT '父级维度编码（用于维度树）',
  `description` varchar(500) DEFAULT NULL COMMENT '维度描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维度字典表：标准维度定义';


-- 指标模型字段绑定关系表
CREATE TABLE `dmp_metric_model_field_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `metric_code` varchar(100) NOT NULL COMMENT '指标编码',
  `model_code` varchar(100) NOT NULL COMMENT '模型编码',
  `field_code` varchar(100) NOT NULL COMMENT '绑定模型字段（字段名或表达式）可以是total_amount,也可以是price*num',
  `binding_type` enum('DIRECT','EXPR') DEFAULT 'DIRECT' COMMENT '绑定类型:直接绑定还是表达式绑定',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标模型字段绑定关系表：记录指标与模型字段的映射关系(可选)';

-- 维度模型字段绑定关系表
CREATE TABLE `dmp_dimension_model_field_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  `dimension_code` varchar(100) NOT NULL COMMENT '指标编码',
  `model_code` varchar(100) NOT NULL COMMENT '模型编码',
  `field_code` varchar(100) NOT NULL COMMENT '绑定模型字段',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维度模型字段绑定关系表：记录维度与模型字段的映射关系(可选)';

--  ----------------------------------------------------------
--  ------------------------比价规则、比价方案----------------------------------

-- 比价规则主表
CREATE TABLE dmp_compare_price_rule (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  rule_code VARCHAR(100) NOT NULL COMMENT '比价规则编码',
  rule_name VARCHAR(200) NOT NULL COMMENT '比价规则名称',
  `dataset_code` varchar(100) NOT NULL COMMENT '数据集编码',
	is_scoring_rule tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否评分型规则：0-否，1-是',
  `description` varchar(500) DEFAULT NULL COMMENT '比价规则描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价规则表';

-- 规则引用的指标（评分型规则使用）
CREATE TABLE dmp_compare_price_rule_metric (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  rule_code VARCHAR(64) NOT NULL COMMENT '比价规则编码',
    `metric_code` varchar(100) NOT NULL COMMENT '指标编码',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价规则引用指标表（可选）';

-- 比价规则关联数据集字段（如商品名、注册证等级、价格字段等）
CREATE TABLE dmp_compare_price_rule_field (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  rule_code VARCHAR(64) NOT NULL COMMENT '比价规则编码',
  `dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `model_code` varchar(100) NOT NULL COMMENT '来源模型编码',
  `model_field_code` varchar(100) NOT NULL COMMENT '引用的模型字段编码',
  `is_metric` tinyint(4) DEFAULT '0' COMMENT '是否为指标字段',
  `is_dimension` tinyint(4) DEFAULT '0' COMMENT '是否为维度字段',
	  `is_compare_factor` tinyint(4) DEFAULT '0' COMMENT '是否比价因子',
`status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价规则绑定数据集字段表';

-- 比价方案主表
CREATE TABLE dmp_compare_price_scheme (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  scheme_code VARCHAR(100) NOT NULL COMMENT '比价方案编码',
  scheme_name VARCHAR(200) NOT NULL COMMENT '比价方案名称',
  rule_code VARCHAR(64) NOT NULL COMMENT '比价规则编码',
  output_type ENUM('REPORT', 'SCORE') DEFAULT 'REPORT' COMMENT '输出类型：报表型 / 评分型',
`description` varchar(500) DEFAULT NULL COMMENT '比价方案描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价方案主表';

-- 比价方案比价维度配置
CREATE TABLE dmp_compare_price_scheme_dimension (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  scheme_code VARCHAR(100) NOT NULL COMMENT '比价方案编码',
`dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `model_code` varchar(100) NOT NULL COMMENT '来源模型编码',
  `model_field_code` varchar(100) NOT NULL COMMENT '引用的模型字段编码',
`status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价方案比价维度配置';

-- 比价方案比价对象
CREATE TABLE dmp_compare_price_scheme_target_object (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
  scheme_code VARCHAR(100) NOT NULL COMMENT '比价方案编码',
  `dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `model_code` varchar(100) NOT NULL COMMENT '来源模型编码',
  `model_field_code` varchar(100) NOT NULL COMMENT '引用的模型字段编码',
`status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价方案比价对象配置表';

-- 比价方案使用的评分因子（评分型规则时配置）
CREATE TABLE dmp_compare_price_scheme_factor_weight (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `enterprise_no` varchar(64) NOT NULL COMMENT '租户编号',
 scheme_code VARCHAR(100) NOT NULL COMMENT '比价方案编码',
  `dataset_code` varchar(100) NOT NULL COMMENT '所属数据集编码',
  `model_code` varchar(100) NOT NULL COMMENT '来源模型编码',
  `model_field_code` varchar(100) NOT NULL COMMENT '引用的模型字段编码',
  weight DECIMAL(5,2) DEFAULT NULL COMMENT '权重（0~100）',
  scoring_method ENUM('LINEAR', 'SEGMENT', 'CUSTOM') DEFAULT 'LINEAR' COMMENT '评分方法(可选，暂无用)',
`status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '数据是否有效：0-无效，1-有效',
  `deleted` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  `create_no` varchar(64) DEFAULT NULL COMMENT '创建人编号',
  `create_name` varchar(128) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(19) DEFAULT NULL COMMENT '创建时间',
  `modify_no` varchar(64) DEFAULT NULL COMMENT '修改人编号',
  `modify_name` varchar(128) DEFAULT NULL COMMENT '修改人名称',
  `modify_time` varchar(19) DEFAULT NULL COMMENT '修改时间',
  `op_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后操作时间',
  PRIMARY KEY (`id`)
) COMMENT='比价方案评分因子配置';