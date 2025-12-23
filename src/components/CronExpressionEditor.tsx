import React, { useMemo } from 'react';
import Cron from 'qnn-react-cron';

type PaneType = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week' | 'year';

export interface CronExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
  defaultTab?: PaneType;
}

const normalizeQuartz7 = (value: string): string => {
  const v = (value || '').trim();
  if (!v) return '0 0 10 * * ? *';
  const parts = v.split(/\s+/);
  if (parts.length === 6) return `${v} *`;
  if (parts.length === 7) return v;
  return '0 0 10 * * ? *';
};

const CronExpressionEditor: React.FC<CronExpressionEditorProps> = ({ value, onChange, defaultTab = 'day' }) => {
  const language = useMemo(
    () => ({
      paneTitle: {
        second: '秒',
        minute: '分',
        hour: '时',
        day: '日',
        month: '月',
        week: '周',
        year: '年'
      },
      assign: '指定',
      donTAssign: '不指定',
      everyTime: {
        second: '每一秒钟',
        minute: '每一分钟',
        hour: '每一小时',
        day: '每一日',
        month: '每一月',
        week: '每一周',
        year: '每一年'
      },
      week: {
        sun: '星期日',
        mon: '星期一',
        tue: '星期二',
        wed: '星期三',
        thu: '星期四',
        fri: '星期五',
        sat: '星期六'
      }
    }),
    []
  );

  return (
    <Cron.Provider
      value={{
        minYear: new Date().getFullYear(),
        maxYear: new Date().getFullYear() + 10,
        language
      }}
    >
      <Cron
        value={normalizeQuartz7(value)}
        panesShow={{
          second: true,
          minute: true,
          hour: true,
          day: true,
          month: true,
          week: true,
          year: false
        }}
        defaultTab={defaultTab}
        onOk={(v: string) => onChange(normalizeQuartz7(v))}
        onChange={(payload: any) => onChange(normalizeQuartz7(payload?.value))}
      />
    </Cron.Provider>
  );
};

export default CronExpressionEditor;
