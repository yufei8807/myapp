import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { createDeployment } from '@/services/flowable/deployment';
import {
  createModel,
  deleteModel,
  getModelSource,
  getModels,
  type Model,
  type ModelRequest,
  updateModel,
} from '@/services/flowable/model';
import ProcessDesigner from '../process-designer/index';

const ModelTableList: React.FC = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>(null);

  // 流程编辑
  const handleProcessEdit = async (record: Model) => {
    try {
      // 获取模型源码
      const blob = await getModelSource(record.id);
      const text = await blob.text();

      // 设置模型数据到状态
      setEditingModel({
        id: record.id,
        name: record.name,
        xml: text,
      });
      setShowDesignerModal(true);
    } catch (error: any) {
      // 如果模型没有源码，创建一个默认的BPMN图
      if (error?.response?.status === 404) {
        const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="http://flowable.org/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js" exporterVersion="8.9.0">
  <bpmn:process id="${record.key || 'Process_1'}" name="${record.name || 'Process'}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${record.key || 'Process_1'}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

        // 设置模型数据到状态
        setEditingModel({
          id: record.id,
          name: record.name,
          xml: defaultDiagram,
        });
        setShowDesignerModal(true);
      } else {
        message.error('获取模型源码失败');
      }
    }
  };

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
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setCurrentModel(record);
            handleUpdateModalVisible(true);
          }}
        >
          编辑
        </Button>,
        <Button
          key="process-edit"
          type="link"
          onClick={() => handleProcessEdit(record)}
        >
          流程编辑
        </Button>,
        <Popconfirm
          key="deploy"
          title="确认部署此模型？"
          onConfirm={async () => {
            try {
              // 首先获取模型源码
              const blob = await getModelSource(record.id);
              const file = new File(
                [blob],
                `${record.name || record.key || 'model'}.bpmn`,
                {
                  type: 'application/bpmn20-xml',
                },
              );

              // 部署模型
              const deployment = await createDeployment(
                file,
                record.key,
                record.name,
                record.tenantId,
              );

              // 更新模型的deploymentId字段
              await updateModel(record.id, {
                ...record,
                deploymentId: deployment.id,
              });

              message.success('部署成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('部署失败');
            }
          }}
        >
          <Button type="link">部署</Button>
        </Popconfirm>,
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

  // 添加状态用于流程设计器模态框
  const [showDesignerModal, setShowDesignerModal] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<{
    id: string;
    name: string;
    xml: string;
  } | null>(null);

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

      <ModalForm<ModelRequest>
        title="更新模型"
        width="400px"
        visible={updateModalVisible}
        onVisibleChange={handleUpdateModalVisible}
        initialValues={currentModel || {}}
        onFinish={async (values) => {
          if (!currentModel) return false;
          try {
            await updateModel(currentModel.id, values);
            message.success('更新成功');
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error('更新失败');
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

      {/* 流程设计器模态框 */}
      <Modal
        title={`流程设计器 - ${editingModel?.name || ''}`}
        width="100%"
        height="80%"
        open={showDesignerModal}
        onCancel={() => setShowDesignerModal(false)}
        footer={null}
        destroyOnClose
      >
        {editingModel && (
          <ProcessDesigner
            modelId={editingModel.id}
            modelXml={editingModel.xml}
            onClose={() => {
              setShowDesignerModal(false);
              actionRef.current?.reload();
            }}
          />
        )}
      </Modal>
    </PageContainer>
  );
};

export default ModelTableList;
