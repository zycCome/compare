with

    ig as (select sku_code from demo_dwd.dim_goods_inspection_group_v

            where enterprise_no in ('${enterprise_no}')

            ${if(len(inspection_group)==0," ","and group_name in ('"+inspection_group+"')")}

            ${if(len(inspection_detail)==0," ","and inspection_id in ('"+inspection_detail+"')")}),

    cgjgtzd as (select distinct t7.enterprise_no,

                                t7.sku_no,

                                t7.sku_code,

                                t7.contract_no,

                                t7.tax_price,

                                t7.tax_rate,

                                t7.no_tax_price,

                                t7.start_bill_date,

                                t7.end_bill_date              as old_end_bill_date,

                                t7.last_row_tag,

                                pc.real_expire_time,

                                pc.real_expire_time_item,

                                pc.plan_expire_time,

                                pc.plan_expire_time_item,

                                case

                                    when t7.last_row_tag = 0 then

                                        (case

                                             when pc.ct_status != 1 then

                                                 (case

                                                      when ifnull(ifnull(pc.real_expire_time_item, pc.real_expire_time_item), '') = ''

                                                          then pc.plan_expire_time_item

                                                      when pc.real_expire_time < pc.real_expire_time_item then pc.real_expire_time

                                                      else pc.real_expire_time_item end)

                                             else (case

                                                       when ifnull(pc.real_expire_time_item, '') != ''

                                                           then ifnull(pc.real_expire_time_item, pc.real_expire_time)

                                                       else ifnull(ifnull(pc.real_expire_time, pc.plan_expire_time), '9999-12-31') end) end)

                                    else t7.end_bill_date end as end_bill_date

                from (select enterprise_no,

                             sku_no,

                             sku_code,

                             contract_no,

                             tax_price,

                             tax_rate,

                             no_tax_price,

                             start_bill_date,

                             end_bill_date,

                             last_row_tag

                      from (select enterprise_no,

                                   sku_no,

                                   sku_code,

                                   contract_no,

                                   tax_price,

                                   tax_rate,

                                   no_tax_price,

                                   start_bill_date,

                                   end_bill_date,

                                   case

                                       when lead(start_bill_date, 1, 0)

                                                 over (partition by enterprise_no, contract_no, sku_code order by start_bill_date) =

                                            start_bill_date then 0

                                       else 1 end as check_date,

                                   last_row_tag

                            from (select distinct enterprise_no,

                                                  sku_no,

                                                  sku_code,

                                                  contract_no,

                                                  price                                    as tax_price,

                                                  tax_rate,

                                                  round((price / (1 + tax_rate / 100)), 2) as no_tax_price,

                                                  start_bill_date,

                                                  case

                                                      when end_bill_date = 0 then '9999-12-31'

                                                      else end_bill_date end               as end_bill_date,

                                                  end_bill_date                            as last_row_tag

                                  from (select enterprise_no,

                                               sku_no,

                                               sku_code,

                                               contract_no,

                                               price,

                                               tax_rate,

                                               real_effective_time_item,

                                               real_expire_time_item,

                                               min_bill_date                                                                        as start_bill_date,

                                               lead(min_bill_date, 1, 0)

                                                    over (partition by enterprise_no, contract_no, sku_code order by min_bill_date) as end_bill_date

                                        from (select distinct enterprise_no,

                                                              sku_no,

                                                              sku_code,

                                                              contract_no,

                                                              price,

                                                              tax_rate,

                                                              real_effective_time_item,

                                                              real_expire_time_item,

                                                              min_bill_date

                                              from (select enterprise_no,

                                                           sku_no,

                                                           sku_code,

                                                           contract_no,

                                                           price,

                                                           tax_rate,

                                                           bill_date,

                                                           real_effective_time_item,

                                                           real_expire_time_item,

                                                           min(bill_date)

                                                               OVER (PARTITION BY enterprise_no, contract_no, sku_code, price, tax_rate) AS min_bill_date

                                                    from (

                                                             -- 未调价的初始价格

                                                             SELECT distinct enterprise_no,

                                                                             sku_no,

                                                                             sku_code,

                                                                             contract_no,

                                                                             price,

                                                                             tax_rate,

                                                                             bill_date,

                                                                             real_effective_time_item,

                                                                             real_expire_time_item

                                                             FROM (SELECT fpci.enterprise_no,

                                                                          fpci.sku_no,

                                                                          fpci.sku_code,

                                                                          fpci.contract_no,

                                                                          to_date(fpci.sign_time) AS bill_date,

                                                                          NULL                    AS bill_no,

                                                                          NULL                    AS bill_id,

                                                                          fpci.price,

                                                                          fpci.tax_rate,

                                                                          fpci.biz_attr,

                                                                          fpci.biz_attr_name,

                                                                          fpci.real_effective_time_item,

                                                                          fpci.real_expire_time_item

                                                                   FROM demo_dwd.fact_pur_con_i fpci

                                                                            left join demo_mysql_rds.yyigou_dsrp.ct_purchase_price_adjust_item cppai

                                                                                      on fpci.enterprise_no = cppai.enterprise_no

                                                                                          and fpci.sku_no = cppai.sku_no

                                                                                          and fpci.contract_no = cppai.contract_no

                                                                   WHERE fpci.deleted = 0

                                                                     AND fpci.status = 1

                                                                     AND fpci.version = 1

                                                                     AND fpci.biz_attr = 1

                                                                     AND cppai.id is null



                                                                   UNION ALL

                                                                   -- 历史初始价格

                                                                   SELECT enterprise_no,

                                                                          sku_no,

                                                                          sku_code,

                                                                          contract_no,

                                                                          to_date(sign_time) AS bill_date,

                                                                          NULL               AS bill_no,

                                                                          NULL               AS bill_id,

                                                                          price,

                                                                          tax_rate,

                                                                          biz_attr,

                                                                          biz_attr_name,

                                                                          real_effective_time_item,

                                                                          real_expire_time_item

                                                                   FROM demo_dwd.fact_pur_con_histroy_i

                                                                   WHERE deleted = 0

                                                                     AND status = 1

                                                                     AND version = 1

                                                                     AND biz_attr = 1

                                                                   UNION ALL



                                                                   -- 历次调价信息

                                                                   SELECT enterprise_no,

                                                                          sku_no,

                                                                          sku_code,

                                                                          contract_no,

                                                                          bill_date,

                                                                          bill_no,

                                                                          bill_id,

                                                                          price,

                                                                          tax_rate,

                                                                          biz_attr,

                                                                          CASE

                                                                              WHEN biz_attr = 1 THEN '采购'

                                                                              WHEN biz_attr = 2 THEN '联动'

                                                                              WHEN biz_attr = 3 THEN '赠品'

                                                                              ELSE ''

                                                                              END             AS biz_attr_name,

                                                                          plan_effective_time as real_effective_time_item,

                                                                          plan_expire_time    as real_expire_time_item

                                                                   FROM demo_mysql_rds.yyigou_dsrp.ct_purchase_price_adjust_item

                                                                   WHERE status = 1

                                                                     AND deleted = 0

                                                                     AND biz_attr = 1) m) t1) t2) t3) t4) t5) t6

                      where check_date = 1) t7

                         left join demo_dwd.fact_pur_con_i pc

                                   on pc.enterprise_no = t7.enterprise_no and pc.contract_no = t7.contract_no and pc.sku_no = t7.sku_no

                                       and pc.deleted = 0

                                       AND pc.status = 1

                                       AND pc.biz_attr = 1

                order by t7.enterprise_no, t7.contract_no, t7.sku_no),

     SJJ001 as (

-- 当前数据与范围组合

         select t.enterprise_no

              , t.contract_no

              , fpci.contract_name

              , fpci.ct_status

              , fpci.ct_status_name

              , fpci.trans_type_no

              , cct.ct_type_name as trans_type_name

              , fpci.manage_org_no

              , fpci.manage_org_name

              , fpci.pur_org_no

              , o2.org_name      as pur_org_name

              , fpci.sign_subject_no

              , o1.org_name      as sign_subject_name

              , fpci.pur_model_code

              , cpm.model_name   as pur_model_name

              , fpci.biz_type_no

              , fpci.biz_type_name

              , fpci.payment_agreement_code

              , ppa.name         as payment_agreement_name

              , fpci.sign_time

              , fpci.plan_effective_time

              , fpci.plan_expire_time

              , fpci.plan_effective_time_item

              , fpci.plan_expire_time_item

              , fpci.supplier_no

              , fpci.supplier_code

              , ds.supplier_name

              , ds.supplier_cooperation_mode

              , ds.supplier_cooperation_mode_name

              , ds.supplier_category_no

              , supplier_owner_company

              , supplier_category_name

              , is_new_supplier

              , fpci.principal_no

              , fpci.principal_name

              , t.sku_no

              , t.sku_code

              , dg.goods_name

              , t.tax_price

              , t.tax_rate

              , t.no_tax_price

              , t.start_bill_date

              , t.end_bill_date

              , t.last_row_tag

              , fpci.biz_attr    as biz_attr_no

              , fpci.biz_attr_name

              , dg.goods_common_name

              , dg.brand_no

              , dg.brand_name

              , dg.goods_spec

              , dg.goods_unit_no

              , dg.goods_unit_name

              , dg.goods_category_no

              , dg.goods_category_code

              , dg.goods_category_name

              , dg.stock_category_no

              , dg.stock_category_code

              , dg.stock_category_name

              , dg.goods_line_no

              , dg.goods_line_name

              , dg.goods_register_code

              , dg.goods_register_name

              , dg.factory_no

              , dg.factory_name

         from (select enterprise_no,

                      sku_no,

                      sku_code,

                      contract_no,

                      tax_price,

                      tax_rate,

                      no_tax_price,

                      start_bill_date,

                      end_bill_date,

                      last_row_tag

               from cgjgtzd) t

                  left join demo_dwd.fact_pur_con_i as fpci

                            on fpci.contract_no = t.contract_no and fpci.sku_no = t.sku_no and

                               fpci.enterprise_no = t.enterprise_no and

                               fpci.is_effectivity_without_category_ct_status = 1 and fpci.biz_attr = 1

                  left join demo_dwd.dim_supplier ds

                            on fpci.supplier_code = ds.supplier_code and fpci.enterprise_no = ds.enterprise_no

                  left join demo_dwd.dim_goods dg

                            on t.sku_no = dg.sku_no and t.enterprise_no = ds.enterprise_no and dg.deleted = 0

                  left join (select enterprise_no, model_code, model_name

                             from demo_mysql_rds.yyigou_dsrp.ct_purchase_model

                             where status = 1

                               and deleted = 0

                               and enable_status = 1) cpm

                            on fpci.pur_model_code = cpm.model_code and fpci.enterprise_no = cpm.enterprise_no

                  left join (select enterprise_no, ct_type_code, ct_type_name

                             from demo_mysql_rds.yyigou_dsrp.ct_contract_type

                             where deleted = 0

                               and status = 1) cct

                            on fpci.trans_type_no = cct.ct_type_code and fpci.enterprise_no = cct.enterprise_no

                  left join demo_mysql_rds.yyigou_ddc.uim_organization o1

                            on fpci.enterprise_no = o1.enterprise_no

                                and fpci.sign_subject_no = o1.org_no

                  left join demo_mysql_rds.yyigou_ddc.uim_organization o2

                            on fpci.enterprise_no = o2.enterprise_no

                                and fpci.pur_org_no = o2.org_no

                  left join demo_mysql_rds.yyigou_dsrp.pay_payment_agreement ppa

                            on fpci.enterprise_no = ppa.enterprise_no

                                and fpci.payment_agreement_code = ppa.code

                                and ppa.deleted = 0

                                and ppa.status = 1

         where t.enterprise_no = '${enterprise_no}'

        -- 产品

        ${if(len(sku_code)==0," ","and dg.sku_code in ('"+sku_code+"')")}

        ${if(len(inspection_group)==0," ","and dg.sku_code in (select sku_code from ig where kso.enterprise_no=ig.enterprise_no)")}

        ${if(len(inspection_detail)==0," ","and dg.sku_code in (select sku_code from ig where kso.enterprise_no=ig.enterprise_no)")}

        ${if(len(goods_structure)==0," ","and dg.is_equ in ('"+goods_structure+"')")}

        ${if(len(category_no)==0," ","and dg.goods_category_no in ('"+SUBSTITUTE(category_no,",","','")+"')")}

        ${if(len(goods_line)==0," ","and dg.goods_line_name in ('"+SUBSTITUTE(goods_line,",","','")+"')")}

        ${if(len(brand_group_name)==0," ","and dg.brand_group_name in ('"+brand_group_name+"')")}

        ${if(len(auxiliary_name)==0," ","and dg.sku_no in (select ag.sku_no from demo_dwd.dim_goods_statistical_classification_f ag where ag.group_code_lv4 in ('"+SUBSTITUTE(auxiliary_name,",","','")+"'))","")}

        ${if(len(brand_name)==0," ","and dg.brand_name in ('"+brand_name+"')")}

        ${if(len(brand_no)==0," ","and dg.brand_no in ('"+brand_no+"')")}

        ${if(len(equipment_category_name)==0," ","and dg.equipment_category_name in ('"+SUBSTITUTE(equipment_category_name,",","','")+"')")}

        ${if(len(brand_belongs)==0," ","and dg.brand_belongs_name in ('"+brand_belongs+"')")}

        ${if(len(instrument_model)==0," ","and dg.equipment_model in ('"+instrument_model+"')")}

        ${if(len(project_second_category_name)==0," ","and dg.project_second_category_name in ('"+project_second_category_name+"')")}

        ${if(len(project_first_category_name)==0," ","and dg.project_first_category_name in ('"+project_first_category_name+"')")}

        ${if(len(adapted_model)==0," ","and dg.goods_adapted_model in ('"+adapted_model+"')")}

        ${if(len(stock_category)==0," ","and dg.stock_category_no in ('"+SUBSTITUTE(stock_category,",","','")+"')")}

        )

select m.sku_code

     , `产品名称`

     , `品牌名称`

     , `存货分类`

     ,${pivot_dynamic_column} pivot_column

     , `分析_供应商名称`

     , `分析_采购模式`

     , `分析_管理组织`

     , `分析_采购组织`

     , `含税单价`

     , `不含税单价`

     , `税率`

     ${if(len(baseline_dynamic_column)==0,"",","+baseline_dynamic_column)}

     , `含税最高价`

     , `含税最低价`

     , `含税均值`

     , `不含税最高价`

     , `不含税最低价`

     , `不含税均值`

     , `基准_含税单价`

     , `基准_不含税单价`

     , `基准_税率`

     ,${if(diff_amount_check==false,"0", "("+diff_amount_a+" - "+diff_amount_b+")")} as `差异额`

     ,${if(diff_amount_rate_check==false,"0", "(("+diff_amount_rate_a+" - "+diff_amount_rate_b+")/"+diff_amount_rate_c+")")} as `差异率`

from (select -- 产品维度

          sku_code

           , goods_name          as `产品名称`

           , brand_name          as `品牌名称`

           , stock_category_name as `存货分类`

-- 行转列

           , supplier_name       as `分析_供应商名称`

           , pur_model_name      as `分析_采购模式`

           , manage_org_name     as `分析_管理组织`

           , pur_org_name        as `分析_采购组织`

-- 价格

           , tax_price           as `含税单价`

           , no_tax_price        as `不含税单价`

           , tax_rate/100            as `税率`

      from SJJ001

      where start_bill_date <= now() and end_bill_date > now()

      ${if(len(dim_org)==0," ","and manage_org_no in ('"+dim_org+"')")}

      ${if(len(pur_org)==0," ","and pur_org_no in ('"+pur_org+"')")}

      -- 采购模式

      ${if(len(ct_purchase_model)==0," ","and pur_model_code in ('"+ct_purchase_model+"')")}

      -- 供应商

      ${if(len(supplier_no)==0," ","and supplier_no in ('"+supplier_no+"')")}

      ${if(len(owner_company)==0," ","and supplier_owner_company in ('"+owner_company+"')")}

      ${if(len(category_name)==0," ","and supplier_category_name in ('"+category_name+"')")}

      ${if(len(supplier_category_no)==0," ","and supplier_category_no in ('"+supplier_category_no+"')")}

      ${if(or(if_new_supplier=2,len(if_new_supplier)==0)," ",if(if_new_supplier=0,"and is_new_supplier = 1","and is_new_supplier = 0"))}

     ) m

         left join (

                    select

                        l.sku_code

                        ${if(len(baseline_dynamic_column)==0,"",","+baseline_dynamic_column)}

                        ,l.`含税最高价`

                        ,l.`含税最低价`

                        ,l.`含税均值`

                        ,l.`不含税最高价`

                        ,l.`不含税最低价`

                        ,l.`不含税均值`

                        ,r.tax_price as `基准_含税单价`

                        ,r.no_tax_price as `基准_不含税单价`

                        ,r.tax_rate/100 as `基准_税率`

                    from (

                        select sku_code

                             , max(tax_price)    as `含税最高价`

                             , min(tax_price)    as `含税最低价`

                             , avg(tax_price)    as `含税均值`

                             , max(no_tax_price) as `不含税最高价`

                             , min(no_tax_price) as `不含税最低价`

                             , avg(no_tax_price) as `不含税均值`

                        from (select -- 产品维度

                                  sku_code

                                   , tax_price

                                   , no_tax_price

                                   , tax_rate/100 as tax_rate

                              from SJJ001

                              where 1=1

                                 ${if(baseline_check==false,"and sku_code = '0'"," ")}

                                 ${if(baseline_time_interval==false,"and start_bill_date <= now() and end_bill_date > now()"," and start_bill_date >= '"+baseline_time_st+"' and end_bill_date <= '"+baseline_time_et+"'")}

                                 ${if(len(baseline_dim_org)==0," ","and manage_org_no in ('"+baseline_dim_org+"')")}

                                 ${if(len(baseline_pur_org)==0," ","and pur_org_no in ('"+baseline_pur_org+"')")}

                                 ${if(len(baseline_ct_purchase_model)==0," ","and pur_model_code in ('"+baseline_ct_purchase_model+"')")}

                                 -- 供应商

                                 ${if(len(baseline_supplier_no)==0," ","and supplier_no in ('"+baseline_supplier_no+"')")}

                                 ${if(len(baseline_owner_company)==0," ","and supplier_owner_company in ('"+baseline_owner_company+"')")}

                                 ${if(len(baseline_category_name)==0," ","and supplier_category_name in ('"+baseline_category_name+"')")}

                                 ${if(len(baseline_supplier_category_no)==0," ","and supplier_category_no in ('"+baseline_supplier_category_no+"')")}

                                 ${if(or(baseline_if_new_supplier=2,len(baseline_if_new_supplier)==0)," ",if(baseline_if_new_supplier=0,"and is_new_supplier = 1","and is_new_supplier = 0"))}

                             ) mm

                        group by sku_code) l

                    left join (

                        select -- 产品维度

                            distinct

                              sku_code

-- 行转列

                               , supplier_name   as `供应商名称`

                               , pur_model_name  as `采购模式`

                               , manage_org_name as `管理组织`

                               , pur_org_name    as `采购组织`

-- 价格

                               ,tax_price

                               ,no_tax_price

                               ,tax_rate

                          from SJJ001

                          where 1=1

                             ${if(baseline_check==false,"and sku_code = '0'"," ")}

                             ${if(baseline_time_interval==false,"and start_bill_date <= now() and end_bill_date > now()"," and start_bill_date >= '"+baseline_time_st+"' and end_bill_date <= '"+baseline_time_et+"'")}

                             ${if(len(baseline_dim_org)==0," ","and manage_org_no in ('"+baseline_dim_org+"')")}

                             ${if(len(baseline_pur_org)==0," ","and pur_org_no in ('"+baseline_pur_org+"')")}

                             ${if(len(baseline_ct_purchase_model)==0," ","and pur_model_code in ('"+baseline_ct_purchase_model+"')")}

                             -- 供应商

                             ${if(len(baseline_supplier_no)==0," ","and supplier_no in ('"+baseline_supplier_no+"')")}

                             ${if(len(baseline_owner_company)==0," ","and supplier_owner_company in ('"+baseline_owner_company+"')")}

                             ${if(len(baseline_category_name)==0," ","and supplier_category_name in ('"+baseline_category_name+"')")}

                             ${if(len(baseline_supplier_category_no)==0," ","and supplier_category_no in ('"+baseline_supplier_category_no+"')")}

                             ${if(or(baseline_if_new_supplier=2,len(baseline_if_new_supplier)==0)," ",if(baseline_if_new_supplier=0,"and is_new_supplier = 1","and is_new_supplier = 0"))}

                    ) r on l.sku_code = r.sku_code

                           -- 没有基准 不拼接，有基准 是明细 也不拼接

                           ${if(baseline_check==false," ", if(STARTWITH(dynamic_baseline_index_column,"基准_")==true, "", " and l." + dynamic_baseline_index_column + " = (case when instr('" + dynamic_baseline_index_column + "','不含税')>0 then r.no_tax_price else r.tax_price end)" ))}

                    ) j

                   on m.sku_code = j.sku_code

where 1=1

${if(diff_amount_check==false,"", if(len(diff_amount_min)==0,"", "and ("+diff_amount_a+" - "+diff_amount_b+") > " + diff_amount_min))}

${if(diff_amount_check==false,"", if(len(diff_amount_max)==0,"", "and ("+diff_amount_a+" - "+diff_amount_b+") < " + diff_amount_max))}

${if(diff_amount_rate_check==false,"", if(len(diff_amount_rate_min)==0,"", "and (("+diff_amount_rate_a+" - "+diff_amount_rate_b+")/"+diff_amount_rate_c+") > " + diff_amount_rate_min))}

${if(diff_amount_rate_check==false,"", if(len(diff_amount_rate_max)==0,"", "and (("+diff_amount_rate_a+" - "+diff_amount_rate_b+")/"+diff_amount_rate_c+") < " + diff_amount_rate_max))}

order by m.sku_code

${if(len(baseline_dynamic_column)==0,"",","+baseline_dynamic_column)}

,${pivot_dynamic_column}