import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import {
  deleteProcessDefinition,
  executeProcessDefinitionAction,
  getProcessDefinitions,
  type ProcessDefinition,
} from '@/services/flowable/processDefinition';

const ProcDefinitionTableList: React.FC = () => {
  /** 新建窗口的弹窗 */
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  /** 分布更新窗口的弹窗 */

  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<ProcessDefinition>[] = [
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
      title: 'Description',
      dataIndex: 'description',
      hideInSearch: true,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      hideInSearch: true,
    },
    {
      title: 'Deployment ID',
      dataIndex: 'deploymentId',
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'suspended',
      valueEnum: {
        false: { text: 'Active', status: 'Success' },
        true: { text: 'Suspended', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.suspended}
          checkedChildren="挂起"
          unCheckedChildren="激活"
          onChange={async (checked) => {
            try {
              await executeProcessDefinitionAction(record.id, {
                action: checked ? 'suspend' : 'activate',
              });
              message.success('操作成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('操作失败');
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确认删除此流程定义？"
          onConfirm={async () => {
            try {
              await deleteProcessDefinition(record.id);
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
      <ProTable<ProcessDefinition>
        headerTitle="流程定义列表"
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
          const { current, pageSize, ...otherParams } = params;
          const response = await getProcessDefinitions({
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
    </PageContainer>
  );
};

export default ProcDefinitionTableList;
