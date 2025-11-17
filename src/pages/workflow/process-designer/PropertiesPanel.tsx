import {
  BellOutlined,
  BranchesOutlined,
  FileTextOutlined,
  FireOutlined,
  ForkOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

interface PropertiesPanelProps {
  modeler: any;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ modeler }) => {
  const [element, setElement] = useState<any>(null);
  const [businessObject, setBusinessObject] = useState<any>(null);
  const [conditionType, setConditionType] = useState<string>('expression');
  const [form] = Form.useForm();

  // 初始化监听器
  useEffect(() => {
    if (!modeler) return;

    // 监听选中节点变化
    const selectionChangedHandler = (e: any) => {
      const selectedElement = e.newSelection[0] || null;
      setElement(selectedElement);
      if (selectedElement) {
        setBusinessObject(selectedElement.businessObject);
        // 设置基础属性
        form.setFieldsValue({
          id: selectedElement.id,
          name: selectedElement.businessObject.name || '',
        });

        // 根据元素类型设置特定属性
        if (selectedElement.type.includes('Gateway')) {
          updateGatewayFormValues();
        } else if (selectedElement.type === 'bpmn:SequenceFlow') {
          updateSequenceFlowFormValues();
        }
      } else {
        // 如果没有选中元素，设置为流程节点
        const rootElements = modeler.getDefinitions()?.rootElements;
        if (rootElements && rootElements.length > 0) {
          const processElement = modeler
            .get('elementRegistry')
            .get(rootElements[0].id);
          if (processElement) {
            setElement(processElement);
            setBusinessObject(processElement.businessObject);
            form.setFieldsValue({
              id: processElement.id,
              name: processElement.businessObject.name || '',
            });
          }
        }
      }
    };

    // 监听元素属性变化
    const elementChangedHandler = (e: any) => {
      // 更新当前元素的属性，无论是否是当前选中的元素
      setBusinessObject(e.element.businessObject);
      if (element && e.element.id === element.id) {
        form.setFieldsValue({
          id: e.element.id,
          name: e.element.businessObject.name || '',
        });

        // 根据元素类型更新特定属性
        if (e.element.type.includes('Gateway')) {
          updateGatewayFormValues();
        } else if (e.element.type === 'bpmn:SequenceFlow') {
          updateSequenceFlowFormValues();
        }
      }
    };

    modeler.on('selection.changed', selectionChangedHandler);
    modeler.on('element.changed', elementChangedHandler);

    // 设置默认选中流程节点
    const setDefaultElement = () => {
      const rootElements = modeler.getDefinitions()?.rootElements;
      if (rootElements && rootElements.length > 0) {
        const processElement = modeler
          .get('elementRegistry')
          .get(rootElements[0].id);
        if (processElement) {
          setElement(processElement);
          setBusinessObject(processElement.businessObject);
          form.setFieldsValue({
            id: processElement.id,
            name: processElement.businessObject.name || '',
          });
        }
      }
    };

    // 延迟设置默认元素，确保模型加载完成
    const timer = setTimeout(setDefaultElement, 100);

    return () => {
      clearTimeout(timer);
      modeler.off('selection.changed', selectionChangedHandler);
      modeler.off('element.changed', elementChangedHandler);
    };
  }, [modeler, form]);

  // 更新元素属性
  const updateElementProperties = (values: any) => {
    if (!element || !modeler) return;

    const modeling = modeler.get('modeling');

    // 更新ID
    if (values.id && values.id !== element.id) {
      try {
        modeling.updateProperties(element, { id: values.id });
      } catch (error) {
        console.error('Failed to update element ID', error);
      }
    }

    // 更新名称
    if (values.name !== undefined) {
      modeling.updateProperties(element, { name: values.name });
      modeling.updateLabel(element, values.name);
    }

    // 更新流程属性
    if (element.type === 'bpmn:Process') {
      // 确保流程定义是可执行的
      if (values.isExecutable !== undefined) {
        modeling.updateProperties(element, {
          isExecutable: values.isExecutable,
        });
      } else if (element.businessObject.isExecutable === undefined) {
        // 如果未设置isExecutable属性，默认设为true
        modeling.updateProperties(element, { isExecutable: true });
      }

      // 更新版本标签
      if (values.versionTag !== undefined) {
        modeling.updateProperties(element, { versionTag: values.versionTag });
      }
    }

    // 更新网关属性
    if (element.type.includes('Gateway')) {
      if (values.gatewayDirection !== undefined) {
        modeling.updateProperties(element, {
          gatewayDirection: values.gatewayDirection,
        });
      }
    }

    // 更新连线属性
    if (element.type === 'bpmn:SequenceFlow') {
      // 处理条件类型和条件表达式
      if (
        values.conditionType !== undefined ||
        values.conditionExpression !== undefined
      ) {
        updateSequenceFlowCondition(
          values.conditionType,
          values.conditionExpression,
        );
      }

      if (values.priority !== undefined) {
        modeling.updateProperties(element, { priority: values.priority });
      }
    }
  };

  // 更新连线条件表达式
  const updateSequenceFlowCondition = (
    conditionType: string,
    conditionExpression: string,
  ) => {
    if (!element || element.type !== 'bpmn:SequenceFlow' || !modeler) return;

    const modeling = modeler.get('modeling');

    // 根据条件类型处理
    switch (conditionType) {
      case 'expression':
        // 表达式类型
        if (conditionExpression && conditionExpression.trim() !== '') {
          const expression = modeler
            .get('moddle')
            .create('bpmn:FormalExpression', {
              body: conditionExpression,
            });
          modeling.updateProperties(element, {
            conditionExpression: expression,
          });
        } else {
          // 如果条件表达式为空，移除条件表达式
          modeling.updateProperties(element, {
            conditionExpression: undefined,
          });
        }
        break;
      case 'script':
        // 脚本类型
        if (conditionExpression && conditionExpression.trim() !== '') {
          const expression = modeler
            .get('moddle')
            .create('bpmn:FormalExpression', {
              body: conditionExpression,
              language: 'javascript',
            });
          modeling.updateProperties(element, {
            conditionExpression: expression,
          });
        } else {
          // 如果条件表达式为空，移除条件表达式
          modeling.updateProperties(element, {
            conditionExpression: undefined,
          });
        }
        break;
      case 'default':
        // 默认流转，移除条件表达式
        modeling.updateProperties(element, { conditionExpression: undefined });
        break;
      default:
        // 默认处理为表达式类型
        if (conditionExpression && conditionExpression.trim() !== '') {
          const expression = modeler
            .get('moddle')
            .create('bpmn:FormalExpression', {
              body: conditionExpression,
            });
          modeling.updateProperties(element, {
            conditionExpression: expression,
          });
        } else {
          // 如果条件表达式为空，移除条件表达式
          modeling.updateProperties(element, {
            conditionExpression: undefined,
          });
        }
    }
  };

  // 处理条件类型切换
  const handleConditionTypeChange = (value: string) => {
    setConditionType(value);
    // 当切换到默认流转时，清空条件表达式
    if (value === 'default') {
      form.setFieldsValue({
        conditionExpression: '',
      });
    }
    // 当切换到表达式或脚本时，保持当前的条件表达式值
  };

  // 更新连线表单初始值
  const updateSequenceFlowFormValues = () => {
    if (element && element.type === 'bpmn:SequenceFlow') {
      const conditionExpression =
        businessObject.conditionExpression?.body || '';

      // 根据条件表达式确定条件类型
      let conditionTypeValue = 'expression';
      if (!businessObject.conditionExpression) {
        conditionTypeValue = 'default';
      } else if (businessObject.conditionExpression.language === 'javascript') {
        conditionTypeValue = 'script';
      }

      // 更新状态
      setConditionType(conditionTypeValue);

      form.setFieldsValue({
        conditionType: conditionTypeValue,
        conditionExpression: conditionExpression,
        priority: businessObject.priority || null,
      });
    }
  };

  // 设置网关的默认流程
  const setGatewayDefaultFlow = (sequenceFlowId: string) => {
    if (!element || !modeler || !element.type.includes('Gateway')) return;

    const modeling = modeler.get('modeling');
    const elementRegistry = modeler.get('elementRegistry');

    // 查找指定的序列流
    const sequenceFlow = elementRegistry.get(sequenceFlowId);
    if (sequenceFlow) {
      // 设置网关的默认流出序列流
      modeling.updateProperties(element, { default: sequenceFlow });
    }
  };

  // 清除网关的默认流程
  const clearGatewayDefaultFlow = () => {
    if (!element || !modeler || !element.type.includes('Gateway')) return;

    const modeling = modeler.get('modeling');
    modeling.updateProperties(element, { default: undefined });
  };

  // 获取从当前网关流出的序列流列表
  const getOutgoingSequenceFlows = () => {
    if (!element || !element.type.includes('Gateway')) return [];

    const outgoing = element.businessObject.outgoing || [];
    return outgoing
      .filter((flow: any) => flow.$type === 'bpmn:SequenceFlow')
      .map((flow: any) => ({
        id: flow.id,
        name: flow.name || flow.id,
      }));
  };

  // 获取当前连线的源元素
  const getSequenceFlowSource = () => {
    if (!element || element.type !== 'bpmn:SequenceFlow') return null;
    return element.source;
  };

  // 检查连线是否可以作为默认流程
  const canBeDefaultFlow = () => {
    if (!element || element.type !== 'bpmn:SequenceFlow') return false;

    const source = getSequenceFlowSource();
    return source && source.type.includes('Gateway');
  };

  // 将当前连线设置为默认流程
  const setAsDefaultFlow = () => {
    if (!element || element.type !== 'bpmn:SequenceFlow') return;

    const source = getSequenceFlowSource();
    if (source && source.type.includes('Gateway')) {
      const modeling = modeler.get('modeling');
      modeling.updateProperties(source, { default: element });
    }
  };

  // 渲染常规信息面板
  const renderBaseInfoPanel = () => {
    if (!businessObject) return null;

    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <InfoCircleOutlined /> 常规信息
          </Typography>
        }
        key="1"
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, values) => updateElementProperties(values)}
        >
          <Form.Item
            label="ID"
            name="id"
            rules={[{ required: true, message: '请输入ID' }]}
          >
            <Input placeholder="元素ID" />
          </Form.Item>
          <Form.Item label="名称" name="name">
            <Input placeholder="元素名称" />
          </Form.Item>
          {businessObject.$type === 'bpmn:Process' && (
            <>
              <Form.Item label="版本标签" name="versionTag">
                <Input placeholder="版本标签" />
              </Form.Item>
              <Form.Item
                label="可执行"
                name="isExecutable"
                valuePropName="checked"
              >
                <Checkbox />
              </Form.Item>
            </>
          )}
        </Form>
      </Collapse.Panel>
    );
  };

  // 渲染表单面板（仅对UserTask和StartEvent显示）
  const renderFormPanel = () => {
    if (
      !element ||
      !['bpmn:UserTask', 'bpmn:StartEvent'].includes(element.type)
    ) {
      return null;
    }

    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <FileTextOutlined /> 表单
          </Typography>
        }
        key="2"
      >
        <Form layout="vertical">
          <Form.Item label="表单Key">
            <Input placeholder="表单Key" />
          </Form.Item>
          <Form.Item label="表单字段">
            <Input.TextArea placeholder="表单字段（JSON格式）" rows={4} />
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  // 渲染任务面板（仅对Task类节点显示）
  const renderTaskPanel = () => {
    if (!element || !element.type.includes('Task')) {
      return null;
    }

    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <FireOutlined /> 任务
          </Typography>
        }
        key="3"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="任务ID">
            <Input placeholder="任务ID" />
          </Form.Item>
          <Form.Item label="任务名称">
            <Input placeholder="任务名称" />
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  // 渲染网关面板（仅对Gateway类节点显示）
  const renderGatewayPanel = () => {
    if (!element || !element.type.includes('Gateway')) {
      return null;
    }

    const outgoingFlows = getOutgoingSequenceFlows();
    const hasDefaultFlow = businessObject.default !== undefined;

    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <ForkOutlined /> 网关
          </Typography>
        }
        key="6"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="网关方向" name="gatewayDirection">
            <Select placeholder="请选择网关方向">
              <Select.Option value="Unspecified">未指定</Select.Option>
              <Select.Option value="Converging">汇聚</Select.Option>
              <Select.Option value="Diverging">发散</Select.Option>
              <Select.Option value="Mixed">混合</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  // 更新网关表单初始值
  const updateGatewayFormValues = () => {
    if (element && element.type.includes('Gateway')) {
      form.setFieldsValue({
        gatewayDirection: businessObject.gatewayDirection || 'Unspecified',
      });
    }
  };

  // 渲染连线面板（仅对SequenceFlow显示）
  const renderSequenceFlowPanel = () => {
    if (!element || element.type !== 'bpmn:SequenceFlow') {
      return null;
    }

    const canBeDefault = canBeDefaultFlow();
    const isDefault =
      element === getSequenceFlowSource()?.businessObject?.default;

    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <BranchesOutlined /> 流转条件
          </Typography>
        }
        key="7"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="条件类型" name="conditionType">
            <Select
              placeholder="请选择条件类型"
              onChange={handleConditionTypeChange}
            >
              <Select.Option value="expression">表达式</Select.Option>
              <Select.Option value="script">脚本</Select.Option>
              <Select.Option value="default">默认流转</Select.Option>
            </Select>
          </Form.Item>

          {/* 根据条件类型显示不同的输入框 */}
          <Form.Item
            label={conditionType === 'script' ? '脚本内容' : '条件表达式'}
            name="conditionExpression"
          >
            <Input.TextArea
              placeholder={
                conditionType === 'script'
                  ? '请输入JavaScript脚本'
                  : '请输入条件表达式'
              }
              rows={3}
            />
          </Form.Item>

          <Form.Item label="优先级" name="priority">
            <InputNumber min={1} max={100} placeholder="优先级" />
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  // 渲染监听器面板
  const renderListenerPanel = () => {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <BellOutlined /> 监听器
          </Typography>
        }
        key="4"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="执行监听器">
            <Input placeholder="执行监听器类名" />
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  // 渲染扩展属性面板
  const renderExtensionPropertiesPanel = () => {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ fontWeight: 'bold' }}>
            <NodeIndexOutlined /> 扩展属性
          </Typography>
        }
        key="5"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="属性名称">
            <Input placeholder="属性名称" />
          </Form.Item>
          <Form.Item label="属性值">
            <Input placeholder="属性值" />
          </Form.Item>
        </Form>
      </Collapse.Panel>
    );
  };

  return (
    <Card
      size="small"
      title="属性面板"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Collapse accordion defaultActiveKey={['1']} ghost>
          {renderBaseInfoPanel()}
          {renderFormPanel()}
          {renderTaskPanel()}
          {renderGatewayPanel()}
          {renderSequenceFlowPanel()}
          {renderListenerPanel()}
          {renderExtensionPropertiesPanel()}
        </Collapse>
      </Space>
    </Card>
  );
};

export default PropertiesPanel;
