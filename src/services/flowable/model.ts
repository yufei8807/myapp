import { request } from '@umijs/max';

// 模型相关类型定义
export interface Model {
  id: string;
  name: string;
  key: string;
  category: string;
  version: number;
  metaInfo: string;
  deploymentId: string;
  tenantId: string;
  url: string;
  createTime: string;
  lastUpdateTime: string;
  deploymentUrl: string;
}

export interface ModelRequest {
  name?: string;
  key?: string;
  category?: string;
  version?: number;
  metaInfo?: string;
  deploymentId?: string;
  tenantId?: string;
}

export interface ModelQueryParams {
  id?: string;
  category?: string;
  categoryLike?: string;
  categoryNotEquals?: string;
  name?: string;
  nameLike?: string;
  key?: string;
  deploymentId?: string;
  version?: number;
  latestVersion?: boolean;
  deployed?: boolean;
  tenantId?: string;
  tenantIdLike?: string;
  withoutTenantId?: boolean;
  sort?: 'id' | 'category' | 'createTime' | 'key' | 'lastUpdateTime' | 'name' | 'version' | 'tenantId';
  order?: 'asc' | 'desc';
  start?: number;
  size?: number;
}

export interface DataResponseModelResponse {
  data: Model[];
  total: number;
  start: number;
  size: number;
  sort: string;
  order: string;
  success?: boolean;
}

/**
 * 获取模型列表
 * @param params 查询参数
 */
export async function getModels(
  params?: ModelQueryParams,
): Promise<DataResponseModelResponse> {
  return request<DataResponseModelResponse>(
    '/process-api/repository/models',
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * 创建模型
 * @param modelRequest 模型请求数据
 */
export async function createModel(
  modelRequest?: ModelRequest,
): Promise<Model> {
  return request<Model>(
    '/process-api/repository/models',
    {
      method: 'POST',
      data: modelRequest,
    },
  );
}

/**
 * 获取特定模型
 * @param modelId 模型ID
 */
export async function getModel(
  modelId: string,
): Promise<Model> {
  return request<Model>(
    `/process-api/repository/models/${modelId}`,
    {
      method: 'GET',
    },
  );
}

/**
 * 更新模型
 * @param modelId 模型ID
 * @param modelRequest 模型请求数据
 */
export async function updateModel(
  modelId: string,
  modelRequest?: ModelRequest,
): Promise<Model> {
  return request<Model>(
    `/process-api/repository/models/${modelId}`,
    {
      method: 'PUT',
      data: modelRequest,
    },
  );
}

/**
 * 删除模型
 * @param modelId 模型ID
 */
export async function deleteModel(
  modelId: string,
): Promise<void> {
  return request(
    `/process-api/repository/models/${modelId}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * 获取模型源码
 * @param modelId 模型ID
 */
export async function getModelSource(
  modelId: string,
): Promise<Blob> {
  return request(
    `/process-api/repository/models/${modelId}/source`,
    {
      method: 'GET',
      responseType: 'blob',
    },
  );
}

/**
 * 设置模型源码
 * @param modelId 模型ID
 * @param file 源码文件
 */
export async function setModelSource(
  modelId: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return request(
    `/process-api/repository/models/${modelId}/source`,
    {
      method: 'PUT',
      data: formData,
    },
  );
}

/**
 * 获取额外的编辑器源码
 * @param modelId 模型ID
 */
export async function getExtraEditorSource(
  modelId: string,
): Promise<Blob> {
  return request(
    `/process-api/repository/models/${modelId}/source-extra`,
    {
      method: 'GET',
      responseType: 'blob',
    },
  );
}

/**
 * 设置额外的编辑器源码
 * @param modelId 模型ID
 * @param file 源码文件
 */
export async function setExtraEditorSource(
  modelId: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return request(
    `/process-api/repository/models/${modelId}/source-extra`,
    {
      method: 'PUT',
      data: formData,
    },
  );
}
