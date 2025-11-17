// @ts-expect-error
/* eslint-disable */
import { request } from '@umijs/max';
import type { TableListItem } from './data';

/** 获取流程定义列表 GET /process-api/repository/process-definitions */
export async function getProcessDefinitions() {
  return request<{
    data: TableListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  }>('/process-api/repository/process-definitions', {
    method: 'GET',
  });
}
