import { PageContainer } from '@ant-design/pro-components';
import { Button, Col, Form, Input, Modal, message, Row, Space } from 'antd';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import React, { useEffect, useRef, useState } from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { useLocation } from '@umijs/max';
import { createDeployment } from '@/services/flowable/deployment';
import {
  getModel,
  getModelSource,
  setModelSource,
} from '@/services/flowable/model';
import styles from './index.less';
import PropertiesPanel from './PropertiesPanel';

// 定义组件属性类型
interface ProcessDesignerProps {
  modelId?: string;
  modelXml?: string;
  onClose?: () => void;
}

const ProcessDesigner: React.FC<ProcessDesignerProps> = ({
  modelId,
  modelXml,
}) => {
  const bpmnModelerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [bpmnModeler, setBpmnModeler] = useState<any>(null);
  const [form] = Form.useForm();
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [modelIdState, setModelIdState] = useState<string | null>(
    modelId || null,
  );
  const [modelName, setModelName] = useState<string>('');
  const location = useLocation();

  // 初始化 BPMN Modeler
  useEffect(() => {
    if (canvasRef.current) {
      // 创建一个基础的 BPMN 模型器
      bpmnModelerRef.current = new BpmnModeler({
        container: canvasRef.current,
        // keyboard 绑定现在是隐式的，不需要显式指定
        moddleExtensions: {
          flowable: 'https://flowable.org/bpmn/schema/flowable-extension.xsd',
        },
      });
      // 更新状态以触发属性面板重新渲染
      setBpmnModeler(bpmnModelerRef.current);

      // 检查传入的属性或URL参数或本地存储中是否有模型数据
      const urlParams = new URLSearchParams(location.search);
      const urlModelId = urlParams.get('modelId');
      const storedModelXml = localStorage.getItem('modelXml');
      const storedModelId = localStorage.getItem('modelId');

      if (modelXml && modelId) {
        // 从传入的属性加载模型
        bpmnModelerRef.current.importXML(modelXml).catch((err: any) => {
          console.error('Failed to import diagram from props', err);
        });
        setModelIdState(modelId);
        // 获取模型名称
        getModel(modelId)
          .then((model) => {
            setModelName(model.name);
          })
          .catch(() => {
            setModelName('流程设计器');
          });
      } else if (urlModelId) {
        // 从URL参数加载模型
        loadModelFromId(urlModelId);
        setModelIdState(urlModelId);
      } else if (storedModelXml && storedModelId) {
        // 从本地存储加载模型
        bpmnModelerRef.current.importXML(storedModelXml).catch((err: any) => {
          console.error('Failed to import diagram from localStorage', err);
        });
        setModelIdState(storedModelId);
        // 清除本地存储
        localStorage.removeItem('modelXml');
        localStorage.removeItem('modelId');
      } else {
        // 创建一个空的 BPMN 图
        const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="http://flowable.org/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js" exporterVersion="8.9.0">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

        bpmnModelerRef.current.importXML(initialDiagram).catch((err: any) => {
          console.error('Failed to import initial diagram', err);
        });
      }
    }

    return () => {
      if (bpmnModelerRef.current) {
        bpmnModelerRef.current.destroy();
      }
    };
  }, [modelId, modelXml]);

  // 从模型ID加载模型
  const loadModelFromId = async (id: string) => {
    try {
      // 获取模型信息
      const model = await getModel(id);
      setModelName(model.name);
      setModelIdState(id);

      // 获取模型源码
      const blob = await getModelSource(id);
      const text = await blob.text();
      bpmnModelerRef.current.importXML(text).catch((err: any) => {
        console.error('Failed to import diagram from model', err);
      });
    } catch (error: any) {
      // 如果模型没有源码，创建一个默认的BPMN图
      if (error?.response?.status === 404) {
        message.warning('模型没有源码，创建默认流程图');

        // 获取模型信息
        const model = await getModel(id);
        setModelName(model.name);
        setModelIdState(id);

        // 创建一个默认的 BPMN 图
        const defaultDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="http://flowable.org/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js" exporterVersion="8.9.0">
  <bpmn:process id="${model.key || 'Process_1'}" name="${model.name || 'Process'}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${model.key || 'Process_1'}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

        bpmnModelerRef.current.importXML(defaultDiagram).catch((err: any) => {
          console.error('Failed to import default diagram', err);
        });
      } else {
        console.error('Failed to load model', error);
        message.error('加载模型失败');
      }
    }
  };

  // 保存 BPMN 文件
  const saveBpmnFile = async () => {
    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });
      const blob = new Blob([xml], { type: 'application/bpmn20-xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = modelName || 'process.bpmn';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('BPMN 文件已保存');
    } catch (err) {
      console.error('Failed to save BPMN file', err);
      message.error('保存 BPMN 文件失败');
    }
  };

  // 更新模型
  const updateExistingModel = async () => {
    if (!modelIdState) {
      message.warning('没有可更新的模型');
      return;
    }

    try {
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });

      // 更新模型源码
      const blob = new Blob([xml], { type: 'application/bpmn20-xml' });
      const file = new File([blob], `model-${modelIdState}.bpmn`, {
        type: 'application/bpmn20-xml',
      });

      await setModelSource(modelIdState, file);
      message.success('模型更新成功');
    } catch (error) {
      console.error('Failed to update model', error);
      message.error('更新模型失败');
    }
  };

  // 部署流程
  const handleDeploy = async (values: any) => {
    try {
      setDeploying(true);
      const { deploymentKey, deploymentName, tenantId } = values;

      // 获取 BPMN XML
      const { xml } = await bpmnModelerRef.current.saveXML({ format: true });

      // 创建文件对象
      const blob = new Blob([xml], { type: 'application/bpmn20-xml' });
      const file = new File(
        [blob],
        `${deploymentName || modelName || 'process'}.bpmn`,
        {
          type: 'application/bpmn20-xml',
        },
      );

      // 部署流程
      await createDeployment(file, deploymentKey, deploymentName, tenantId);
      message.success('流程部署成功');
      setDeployModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to deploy process', error);
      message.error('流程部署失败');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <PageContainer
      breadcrumbRender={false}
      header={{ title: '', subTitle: '' }}
    >
      <Row gutter={8} className={styles.container}>
        <Col span={18} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.toolbar}>
            <Space>
              <Button onClick={saveBpmnFile} type="primary">
                保存 BPMN
              </Button>
              {modelIdState && (
                <Button onClick={updateExistingModel} type="primary">
                  更新模型
                </Button>
              )}
              <Button
                onClick={() => setDeployModalVisible(true)}
                type="primary"
              >
                部署流程
              </Button>
            </Space>
          </div>
          <div className={styles.canvas} ref={canvasRef} />
        </Col>
        <Col span={6}>
          <PropertiesPanel modeler={bpmnModeler} />
        </Col>
      </Row>

      {/* 部署模态框 */}
      <Modal
        title="部署流程"
        open={deployModalVisible}
        onCancel={() => {
          setDeployModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleDeploy} layout="vertical">
          <Form.Item name="deploymentKey" label="部署Key">
            <Input placeholder="请输入部署Key" />
          </Form.Item>

          <Form.Item
            name="deploymentName"
            label="部署名称"
            rules={[{ required: true, message: '请输入部署名称!' }]}
          >
            <Input placeholder="请输入部署名称" />
          </Form.Item>

          <Form.Item name="tenantId" label="租户ID">
            <Input placeholder="请输入租户ID" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={deploying}
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

export default ProcessDesigner;
