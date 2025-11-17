import { request } from '@umijs/max';

// 部署相关类型定义
export interface Deployment {
  id: string;
  name: string;
  deploymentTime: string;
  category: string;
  parentDeploymentId: string;
  url: string;
  tenantId: string;
}

export interface DeploymentResource {
  id: string;
  url: string;
  contentUrl: string;
  mediaType: string;
  type: 'resource' | 'processDefinition' | 'processImage';
}

export interface DeploymentQueryParams {
  name?: string;
  nameLike?: string;
  category?: string;
  categoryNotEquals?: string;
  parentDeploymentId?: string;
  parentDeploymentIdLike?: string;
  tenantId?: string;
  tenantIdLike?: string;
  withoutTenantId?: boolean;
  sort?: 'id' | 'name' | 'deploymentTime' | 'tenantId';
  order?: 'asc' | 'desc';
  start?: number;
  size?: number;
}

export interface DataResponseDeployment {
  data: Deployment[];
  total: number;
  start: number;
  size: number;
  sort: string;
  order: string;
  success?: boolean;
}

/**
 * 部署流程定义
 * @param file 流程定义文件
 * @param name 部署名称
 * @param category 部署分类
 * @param tenantId 租户ID
 */
export async function createDeployment(
  file: File,
  deploymentKey?: string,
  deploymentName?: string,
  tenantId?: string,
): Promise<Deployment> {
  const formData = new FormData();

  // 确保文件名正确传递
  if (file instanceof File) {
    formData.append('file', file, file.name);
  } else {
    // 如果不是File对象，报错
    throw new Error('File object is required');
  }

  // 构建查询参数对象
  const params: Record<string, any> = {};
  if (deploymentKey) params.deploymentKey = deploymentKey;
  if (deploymentName) params.deploymentName = deploymentName;
  if (tenantId) params.tenantId = tenantId;

  return request<Deployment>('/process-api/repository/deployments', {
    method: 'POST',
    data: formData,
    params: params, // 将参数作为查询字符串传递
  });
}

/**
 * 获取部署列表
 * @param params 查询参数
 */
export async function getDeployments(
  params?: DeploymentQueryParams,
): Promise<DataResponseDeployment> {
  return request<DataResponseDeployment>(
    '/process-api/repository/deployments',
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * 获取特定部署
 * @param deploymentId 部署ID
 */
export async function getDeployment(
  deploymentId: string,
): Promise<Deployment> {
  return request<Deployment>(
    `/process-api/repository/deployments/${deploymentId}`,
    {
      method: 'GET',
    },
  );
}

/**
 * 删除部署
 * @param deploymentId 部署ID
 */
export async function deleteDeployment(
  deploymentId: string,
): Promise<void> {
  return request(
    `/process-api/repository/deployments/${deploymentId}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * 获取部署资源列表
 * @param deploymentId 部署ID
 */
export async function getDeploymentResources(
  deploymentId: string,
): Promise<DeploymentResource[]> {
  return request<DeploymentResource[]>(
    `/process-api/repository/deployments/${deploymentId}/resources`,
    {
      method: 'GET',
    },
  );
}

/**
 * 获取部署资源内容
 * @param deploymentId 部署ID
 * @param resourceName 资源名称
 */
export async function getDeploymentResourceData(
  deploymentId: string,
  resourceName: string,
): Promise<Blob> {
  return request(
    `/process-api/repository/deployments/${deploymentId}/resourcedata/${resourceName}`,
    {
      method: 'GET',
      responseType: 'blob',
    },
  );
}
