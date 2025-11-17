import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, message, Popconfirm, Upload } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createDeployment,
  type Deployment,
  deleteDeployment,
  getDeployments,
} from '@/services/flowable/deployment';

const DeploymentTableList: React.FC = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const columns: ProColumns<Deployment>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      tip: '部署ID',
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
    },
    {
      title: 'Deployment Time',
      dataIndex: 'deploymentTime',
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenantId',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确认删除"
          description="确定要删除这个部署吗？此操作不可恢复"
          onConfirm={async () => {
            try {
              await deleteDeployment(record.id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('删除失败');
            }
          }}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const handleCreate = async (values: any) => {
    try {
      setUploading(true);
      const { deploymentKey, deploymentName, tenantId } = values;

      // 确保有文件被选择
      if (fileList.length === 0) {
        message.error('请选择流程文件!');
        return;
      }

      const file = fileList[0].originFileObj || fileList[0];
      await createDeployment(file, deploymentKey, deploymentName, tenantId);
      message.success('部署成功');
      handleModalVisible(false);
      form.resetFields();
      setFileList([]); // 清空文件列表
      actionRef.current?.reload();
    } catch (error) {
      message.error('部署失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageContainer>
      <ProTable<Deployment>
        headerTitle="部署管理"
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
            <PlusOutlined /> 部署流程
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, ...otherParams } = params;
          const response = await getDeployments({
            ...otherParams,
            start: ((current || 1) - 1) * (pageSize || 20),
            size: pageSize || 20,
          });
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        columns={columns}
      />

      <Modal
        title="部署流程"
        visible={createModalVisible}
        onCancel={() => {
          handleModalVisible(false);
          form.resetFields();
          setFileList([]); // 清空文件列表
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="file"
            label="流程文件"
            rules={[{ required: true, message: '请选择流程文件!' }]}
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="deploymentKey" label="部署Key">
            <Input placeholder="请输入部署Key" />
          </Form.Item>

          <Form.Item name="deploymentName" label="部署名称">
            <Input placeholder="请输入部署名称" />
          </Form.Item>

          <Form.Item name="tenantId" label="租户ID">
            <Input placeholder="请输入租户ID" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              style={{ width: '100%' }}
            >
              部署
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DeploymentTableList;
