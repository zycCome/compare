declare module 'qnn-react-cron' {
  import * as React from 'react';

  export interface CronChangePayload {
    type: string;
    value: string;
  }

  export interface CronProviderValue {
    minYear?: number;
    maxYear?: number;
    language?: any;
  }

  export interface CronComponentProps {
    value: string;
    panesShow?: Record<string, boolean>;
    defaultTab?: string;
    onOk?: (value: string) => void;
    onChange?: (payload: CronChangePayload) => void;
    getCronFns?: (fns: any) => void;
    footer?: React.ReactNode[];
  }

  export interface CronStatics {
    Provider: React.FC<{ value: CronProviderValue; children: React.ReactNode }>;
  }

  const Cron: React.FC<CronComponentProps> & CronStatics;
  export default Cron;
}
