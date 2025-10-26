import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './App.css';

const API_URL = 'http://localhost:8080/api/entries';
const UPLOAD_URL = 'http://localhost:8080/uploads/';

function App() {
  // --- 상태 변수 (기존과 동일) ---
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    researcher: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- useEffect (기존과 동일) ---
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await axios.get(API_URL);
        setEntries(response.data.reverse());
      } catch (error) {
        console.error("데이터를 불러오는 중 오류 발생:", error);
      }
    };
    fetchEntries();
  }, []);

  // --- 이벤트 핸들러 (handleInputChange, handleFileChange, resetForm - 기존과 동일) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const resetForm = () => {
    setNewEntry({ title: '', content: '', researcher: '' });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  // --- [추가] 파일명으로 이미지 여부를 확인하는 헬퍼 함수 ---
  const isImageFile = (filename) => {
    if (!filename) return false;
    // 파일 확장자를 소문자로 변환하여 체크
    const lowerFilename = filename.toLowerCase();
    // 일반적인 이미지 확장자 목록
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    // 목록 중 하나로 끝나는지 확인
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
  };

  // --- [추가] UUID 제거하고 원본 파일명만 보여주는 헬퍼 함수 ---
  const getOriginalFileName = (storedFileName) => {
    if (!storedFileName) return '';
    // "UUID_원본파일명" 형식으로 저장했으므로, 첫 번째 '_' 이후의 문자열을 반환
    const parts = storedFileName.split('_');
    if (parts.length > 1) {
      // parts[0]은 UUID, parts[1]부터가 원본 파일명
      return parts.slice(1).join('_');
    }
    // 혹시 '_'가 없는 파일명이면 그냥 반환
    return storedFileName;
  };

  // --- handleSubmit, handleEditClick, handleDelete (기존과 동일) ---
  // (handleSubmit, handleEditClick, handleDelete 함수 코드는
  // 이전 답변과 100% 동일하므로 공간 절약을 위해 생략합니다.)
  // (만약 필요하시면 다시 요청해주세요)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newEntry.title || !newEntry.content) {
      Swal.fire({
        icon: 'warning',
        title: '입력 오류',
        text: '제목과 내용은 필수입니다.',
      });
      return;
    }
    const formData = new FormData();
    formData.append("entry", JSON.stringify(newEntry));
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      if (isEditing) {
        const response = await axios.put(`${API_URL}/${currentEntryId}`, formData);
        setEntries(entries.map(entry =>
            entry.id === currentEntryId ? response.data : entry
        ));
        resetForm();
        Swal.fire({ icon: 'success', title: '수정 완료!', showConfirmButton: false, timer: 1500 });
      } else {
        const response = await axios.post(API_URL, formData);
        setEntries([response.data, ...entries]);
        resetForm();
        Swal.fire({ icon: 'success', title: '저장 완료!', showConfirmButton: false, timer: 1500 });
      }
    } catch (error) {
      console.error("데이터 처리 중 오류 발생:", error);
      Swal.fire({ icon: 'error', title: '서버 오류', text: '데이터 처리 중 문제가 발생했습니다. (백엔드 로그 확인)' });
    }
  };

  const handleEditClick = (entry) => {
    setIsEditing(true);
    setCurrentEntryId(entry.id);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      researcher: entry.researcher
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: '정말 삭제하시겠습니까?',
      text: "이 작업은 되돌릴 수 없습니다!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/${id}`);
          setEntries(entries.filter(entry => entry.id !== id));
          if (isEditing && currentEntryId === id) {
            resetForm();
          }
          Swal.fire('삭제 완료!', '실험 기록이 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
          console.error("데이터 삭제 중 오류 발생:", error);
          Swal.fire('오류 발생', '데이터 삭제 중 문제가 발생했습니다.', 'error');
        }
      }
    });
  };


  // --- JSX 렌더링 ---
  return (
      <div className="App">
        <header className="App-header">
          <h1>나의 실험 노트 🧪</h1>
        </header>

        {/* --- 작성/수정 폼 --- */}
        <div className="form-container">
          <h2>{isEditing ? '실험 기록 수정' : '새 실험 기록 작성'}</h2>

          <form onSubmit={handleSubmit}>
            {/* (실험자, 제목, 내용 - 동일) */}
            <div>
              <label>실험자: </label>
              <input
                  type="text"
                  name="researcher"
                  value={newEntry.researcher}
                  onChange={handleInputChange}
                  placeholder="이름 (예: 이준혁)"
              />
            </div>
            <div>
              <label>제목: </label>
              <input
                  type="text"
                  name="title"
                  value={newEntry.title}
                  onChange={handleInputChange}
                  placeholder="실험 제목 (필수)"
                  required
              />
            </div>
            <div>
              <label>실험 내용: </label>
              <textarea
                  name="content"
                  value={newEntry.content}
                  onChange={handleInputChange}
                  placeholder="실험 과정 및 결과 (필수)"
                  required
              />
            </div>

            {/* [수정] 파일 업로드 input */}
            <div>
              <label>첨부 파일 (이미지, 문서 등): </label>
              <input
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}

                  // [수정] accept 속성 추가: 다양한 파일 형식을 받도록 허용
                  // (모든 이미지, pdf, doc/docx, txt 파일 등)
                  accept="image/*, .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .hwp"
              />
              {isEditing && (
                  <small style={{display: 'block', marginTop: '5px', color: '#777'}}>
                    파일을 변경하려면 새 파일을 선택하세요.
                  </small>
              )}
            </div>

            {/* (버튼 그룹 - 동일) */}
            <div className="button-group">
              <button type="submit">
                {isEditing ? '수정 완료' : '기록 저장'}
              </button>
              {isEditing && (
                  <button
                      type="button"
                      onClick={resetForm}
                      className="cancel-button"
                  >
                    수정 취소
                  </button>
              )}
            </div>
          </form>
        </div>

        {/* --- 기록 목록 --- */}
        <div className="entries-list">
          <h2>전체 실험 기록</h2>
          {entries.length > 0 ? (
              entries.map(entry => (
                  <div key={entry.id} className="entry-item">

                    {/* (제목, 실험자, 내용 - 동일) */}
                    <h3>{entry.title}</h3>
                    <p><strong>실험자:</strong> {entry.researcher || '미기입'}</p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p>

                    {/* [핵심 수정] 첨부 파일 표시 (이미지/문서 분기 처리) */}
                    {entry.attachedFilePath && ( // 1. 파일 경로가 있을 때만 렌더링
                        // 클래스 이름을 .attached-file-container로 일반화
                        <div className="attached-file-container">
                          <p><strong>첨부된 파일:</strong></p>

                          {/* 2. isImageFile 헬퍼 함수로 이미지인지 확인 */}
                          {isImageFile(entry.attachedFilePath) ? (

                              // 3-1. 이미지일 경우: <img> 태그
                              <img
                                  src={UPLOAD_URL + entry.attachedFilePath}
                                  alt="실험 결과"
                                  className="attached-image" // 기존 CSS 재사용
                              />
                          ) : (

                              // 3-2. 이미지가 아닐 경우: <a> 태그 (다운로드 링크)
                              <div className="attached-document">
                                <a
                                    href={UPLOAD_URL + entry.attachedFilePath}
                                    target="_blank" // 새 탭에서 열기
                                    rel="noopener noreferrer" // 보안 설정
                                    download // 브라우저가 파일을 바로 열지 않고 '다운로드' 하도록 권장
                                >
                                  {/* 원본 파일명만 표시 (UUID 제거) */}
                                  📄 {getOriginalFileName(entry.attachedFilePath)}
                                </a>
                              </div>
                          )}
                        </div>
                    )}

                    {/* (메타 정보, 버튼 영역 - 동일) */}
                    <small>작성일: {new Date(entry.createdAt).toLocaleString()} (최근 수정: {new Date(entry.updatedAt).toLocaleString()})</small>

                    <div className="entry-buttons">
                      <button
                          onClick={() => handleEditClick(entry)}
                          className="edit-button"
                      >
                        수정
                      </button>
                      <button
                          onClick={() => handleDelete(entry.id)}
                          className="delete-button"
                      >
                        삭제
                      </button>
                    </div>

                  </div>
              ))
          ) : (
              <p>아직 기록된 실험 노트가 없습니다.</p>
          )}
        </div>
      </div>
  );
}

export default App;