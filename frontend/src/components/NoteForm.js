import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FiSave, FiCopy, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';

const NoteForm = (props) => {
    const {
        formData, handleFormChange, handleContentChange,
        handleSubmit, handleCancelEdit, handleSaveAsTemplate,
        isEditing, templates, handleApplyTemplate, projects,
        quillRef, modules, formats,
        fileInputRef, handleFileChange
    } = props;

    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    const onApplyTemplate = () => {
        if (!selectedTemplateId) {
            Swal.fire('선택 오류', '적용할 템플릿을 먼저 선택해주세요.', 'warning');
            return;
        }

        const apply = () => {
            handleApplyTemplate(selectedTemplateId);
            setSelectedTemplateId("");
        };

        if (formData.content && formData.content.replace(/<(.|\n)*?>/g, '').trim() !== '') {
            Swal.fire({
                title: '내용 덮어쓰기 경고',
                text: "템플릿을 적용하면 현재 작성된 내용이 사라집니다. 계속하시겠습니까?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: '적용',
                cancelButtonText: '취소'
            }).then((result) => {
                if (result.isConfirmed) {
                    apply();
                }
            });
        } else {
            apply();
        }
    };

    return (
        <Form className="form-view" onSubmit={handleSubmit}>
            <div className="form-header">
                <h2>{isEditing ? '실험 노트 수정' : '새 실험 노트 작성'}</h2>
            </div>

            {templates.length > 0 && (
                <Form.Group as={Row} className="mb-3 align-items-center" controlId="template-selector">
                    <Form.Label column sm={2}>템플릿 불러오기</Form.Label>
                    <Col sm={7}>
                        <Form.Select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                            <option value="" disabled>적용할 템플릿 선택...</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col sm={3}>
                        <Button variant="outline-primary" className="w-100" onClick={onApplyTemplate}>
                            적용
                        </Button>
                    </Col>
                </Form.Group>
            )}

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="researcher">실험자</Form.Label>
                        <Form.Control id="researcher" type="text" name="researcher" value={formData.researcher} onChange={handleFormChange} placeholder="이름 (예: 홍길동)" />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="projectId">프로젝트</Form.Label>
                        <Form.Select id="projectId" name="projectId" value={formData.projectId} onChange={handleFormChange}>
                            <option value="">-- 미분류 --</option>
                            {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="title">제목</Form.Label>
                <Form.Control id="title" type="text" name="title" value={formData.title} onChange={handleFormChange} placeholder="실험 제목 (필수)" required />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="tags">태그</Form.Label>
                <Form.Control id="tags" type="text" name="tags" value={formData.tags} onChange={handleFormChange} placeholder="쉼표(,)로 태그를 구분하세요 (예: 실험, 데이터, 분석)" />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>실험 내용</Form.Label>
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    formats={formats}
                />
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label htmlFor="file">첨부 파일</Form.Label>
                <Form.Control id="file" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*, .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .hwp" />
                {isEditing && (<Form.Text className="text-muted">파일을 변경하려면 새 파일을 선택하세요.</Form.Text>)}
            </Form.Group>

            <div className="form-buttons">
                <Button variant="primary" type="submit" size="lg">
                    <FiSave /> {isEditing ? '수정 완료' : '기록 저장'}
                </Button>
                <Button variant="secondary" type="button" onClick={handleCancelEdit}>
                    <FiXCircle /> 취소
                </Button>
                <Button variant="outline-secondary" type="button" onClick={handleSaveAsTemplate} title="현재 내용을 새 템플릿으로 저장">
                    <FiCopy /> 템플릿으로 저장
                </Button>
            </div>
        </Form>
    );
};

export default NoteForm;
