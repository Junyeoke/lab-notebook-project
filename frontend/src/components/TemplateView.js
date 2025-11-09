import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';

const TemplateView = ({ templates, onSaveTemplate, onDeleteTemplate }) => {
    const [showModal, setShowModal] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateName, setTemplateName] = useState('');
    const [templateContent, setTemplateContent] = useState('');

    const handleShowModal = (template = null) => {
        if (template) {
            setCurrentTemplate(template);
            setTemplateName(template.name);
            setTemplateContent(template.content);
        } else {
            setCurrentTemplate(null);
            setTemplateName('');
            setTemplateContent('');
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSave = async () => {
        if (!templateName.trim()) {
            Swal.fire('입력 오류', '템플릿 이름은 비워둘 수 없습니다.', 'warning');
            return;
        }
        await onSaveTemplate({
            id: currentTemplate?.id,
            name: templateName,
            content: templateContent,
        });
        handleCloseModal();
    };

    const handleDelete = (e, template) => {
        e.stopPropagation();
        onDeleteTemplate(e, template);
    };

    return (
        <div className="template-view">
            <div className="view-header">
                <h1>템플릿 관리</h1>
                <Button variant="primary" onClick={() => handleShowModal()}>
                    <FiPlus /> 새 템플릿 만들기
                </Button>
            </div>
            <p>자주 사용하는 노트 양식을 템플릿으로 저장하고 관리하세요.</p>

            <div className="template-list">
                {templates.length > 0 ? (
                    templates.map(template => (
                        <div key={template.id} className="template-card" onClick={() => handleShowModal(template)}>
                            <div className="template-card-icon"><FiFileText /></div>
                            <div className="template-card-body">
                                <h5>{template.name}</h5>
                                <p>{template.content.replace(/<[^>]+>/g, '').substring(0, 100)}...</p>
                            </div>
                            <div className="template-card-actions">
                                <Button variant="outline-danger" size="sm" onClick={(e) => handleDelete(e, template)}>
                                    <FiTrash2 />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="list-empty-message">
                        <p>생성된 템플릿이 없습니다.</p>
                        <p>'새 템플릿 만들기' 버튼을 눌러 첫 템플릿을 만들어보세요.</p>
                    </div>
                )}
            </div>

            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{currentTemplate ? '템플릿 수정' : '새 템플릿 생성'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>템플릿 이름</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="템플릿 이름을 입력하세요"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>템플릿 내용</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={10}
                                placeholder="템플릿 내용을 입력하세요..."
                                value={templateContent}
                                onChange={(e) => setTemplateContent(e.target.value)}
                            />
                             <Form.Text className="text-muted">
                                현재 템플릿은 일반 텍스트만 지원합니다. (HTML 미지원)
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        저장
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TemplateView;
