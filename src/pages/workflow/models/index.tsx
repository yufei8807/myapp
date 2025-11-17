import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createModel,
  deleteModel,
  getModels,
  type Model,
  type ModelRequest,
} from '@/services/flowable/model';

const ModelTableList: React.FC = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<Model>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      tip: 'ID是唯一的 key',
      sorter: true,
    },
    {
      title: 'Key',
      dataIndex: 'key',
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      hideInSearch: true,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      sorter: true,
    },
    {
      title: 'Deployment ID',
      dataIndex: 'deploymentId',
      hideInSearch: true,
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenantId',
      hideInSearch: true,
    },
    {
      title: 'Create Time',
      dataIndex: 'createTime',
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: 'Last Update Time',
      dataIndex: 'lastUpdateTime',
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确认删除此模型？"
          onConfirm={async () => {
            try {
              await deleteModel(record.id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('删除失败');
            }
          }}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<Model>
        headerTitle="模型列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 20, ...otherParams } = params;
          const response = await getModels({
            ...otherParams,
            start: (current - 1) * pageSize,
            size: pageSize,
          });
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        columns={columns}
      />
      <ModalForm<ModelRequest>
        title="创建模型"
        width="400px"
        visible={createModalVisible}
        onVisibleChange={handleModalVisible}
        onFinish={async (values) => {
          try {
            await createModel(values);
            message.success('创建成功');
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error('创建失败');
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="模型名称"
          rules={[
            {
              required: true,
              message: '请输入模型名称',
            },
          ]}
        />
        <ProFormText
          name="key"
          label="模型Key"
          rules={[
            {
              required: true,
              message: '请输入模型Key',
            },
          ]}
        />
        <ProFormText name="category" label="分类" />
      </ModalForm>
    </PageContainer>
  );
};

export default ModelTableList;
