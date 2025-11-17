import { request } from '@umijs/max';

// 流程定义相关类型定义
export interface ProcessDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  version: number;
  category: string;
  deploymentId: string;
  resourceName: string;
  diagramResourceName: string;
  tenantId: string;
  suspended: boolean;
  url: string;
  deploymentUrl: string;
  parentProcessDefinitionId: string;
}

export interface ProcessDefinitionQueryParams {
  version?: number;
  name?: string;
  nameLike?: string;
  key?: string;
  keyLike?: string;
  resourceName?: string;
  resourceNameLike?: string;
  category?: string;
  categoryLike?: string;
  categoryNotEquals?: string;
  deploymentId?: string;
  startableByUser?: string;
  latest?: boolean;
  suspended?: boolean;
  sort?: 'name' | 'id' | 'key' | 'category' | 'deploymentId' | 'version';
  start?: number;
  size?: number;
}

export interface ProcessDefinitionActionRequest {
  action: 'activate' | 'suspend' | 'update-category';
  category?: string;
  includeProcessInstances?: boolean;
  date?: string;
}

export interface DataResponseProcessDefinition {
  data: ProcessDefinition[];
  total: number;
  start: number;
  size: number;
  sort: string;
  order: string;
  success?: boolean;
}

/**
 * 获取流程定义列表
 * @param params 查询参数
 */
export async function getProcessDefinitions(
  params?: ProcessDefinitionQueryParams,
): Promise<DataResponseProcessDefinition> {
  return request<DataResponseProcessDefinition>(
    '/process-api/repository/process-definitions',
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * 获取特定流程定义
 * @param processDefinitionId 流程定义ID
 */
export async function getProcessDefinition(
  processDefinitionId: string,
): Promise<ProcessDefinition> {
  return request<ProcessDefinition>(
    `/process-api/repository/process-definitions/${processDefinitionId}`,
    {
      method: 'GET',
    },
  );
}

/**
 * 执行流程定义操作（激活/挂起/更新分类）
 * @param processDefinitionId 流程定义ID
 * @param actionRequest 操作请求
 */
export async function executeProcessDefinitionAction(
  processDefinitionId: string,
  actionRequest: ProcessDefinitionActionRequest,
): Promise<ProcessDefinition> {
  return request<ProcessDefinition>(
    `/process-api/repository/process-definitions/${processDefinitionId}`,
    {
      method: 'PUT',
      data: actionRequest,
    },
  );
}

/**
 * 删除流程定义
 * @param processDefinitionId 流程定义ID
 */
export async function deleteProcessDefinition(
  processDefinitionId: string,
): Promise<void> {
  return request(
    `/process-api/repository/process-definitions/${processDefinitionId}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * 获取流程定义资源数据
 * @param processDefinitionId 流程定义ID
 */
export async function getProcessDefinitionResourceData(
  processDefinitionId: string,
): Promise<Blob> {
  return request(
    `/process-api/repository/process-definitions/${processDefinitionId}/resourcedata`,
    {
      method: 'GET',
      responseType: 'blob',
    },
  );
}

/**
 * 获取流程定义图像
 * @param processDefinitionId 流程定义ID
 */
export async function getProcessDefinitionImage(
  processDefinitionId: string,
): Promise<Blob> {
  return request(
    `/process-api/repository/process-definitions/${processDefinitionId}/image`,
    {
      method: 'GET',
      responseType: 'blob',
    },
  );
}
