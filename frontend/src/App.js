import React, { useState, useEffect } from 'react'; // React 훅 임포트
import axios from 'axios'; // API 통신을 위한 axios 임포트
import './App.css'; // 기본 CSS (나중에 꾸미기용)

// 백엔드 API 서버의 기본 URL (Spring Boot가 8080 포트에서 실행 중)
const API_URL = 'http://localhost:8080/api/entries';

function App() {
  // 1. 상태(State) 변수 정의
  // (1) entries: DB에서 가져온 실험 기록 목록 (배열)
  const [entries, setEntries] = useState([]);

  // (2) newEntry: 새로 작성 중인 실험 기록 (객체)
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    researcher: ''
  });

  // 2. 이펙트(Effect) 훅: 컴포넌트가 처음 렌더링될 때 실행
  // (목적: 백엔드에서 데이터 목록을 가져오기)
  useEffect(() => {
    // 데이터를 가져오는 비동기 함수 정의
    const fetchEntries = async () => {
      try {
        // (GET) /api/entries 요청
        const response = await axios.get(API_URL);
        // 성공 시, 응답 데이터를 entries 상태에 저장 (최신순으로 정렬)
        setEntries(response.data.reverse());
      } catch (error) {
        console.error("데이터를 불러오는 중 오류 발생:", error);
      }
    };

    fetchEntries(); // 함수 실행
  }, []); // [] (빈 의존성 배열): 이 Effect는 마운트 시 *한 번만* 실행됨

  // 3. 이벤트 핸들러: 입력 폼(input, textarea) 값이 변경될 때 실행
  const handleInputChange = (e) => {
    const { name, value } = e.target; // 변경된 input의 name과 value
    // newEntry 상태를 업데이트 (기존 값은 유지하고, 변경된 필드[name]만 덮어쓰기)
    setNewEntry(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // 4. 이벤트 핸들러: '기록 저장' 버튼 클릭 시 실행
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출(submit) 시 발생하는 페이지 새로고침 방지

    // 간단한 유효성 검사
    if (!newEntry.title || !newEntry.content) {
      alert("제목과 내용은 필수입니다.");
      return;
    }

    try {
      // (POST) /api/entries 요청 (newEntry 데이터를 JSON으로 전송)
      const response = await axios.post(API_URL, newEntry);

      // (성공) 목록(entries) 상태를 업데이트 (새 항목을 맨 위에 추가)
      setEntries([response.data, ...entries]);

      // (성공) newEntry 폼 초기화
      setNewEntry({ title: '', content: '', researcher: '' });

    } catch (error) {
      console.error("데이터 저장 중 오류 발생:", error);
    }
  };

  // 5. JSX 렌더링 (화면에 보이는 부분)
  return (
      <div className="App">
        <header className="App-header">
          <h1>나의 실험 노트 🧪</h1>
        </header>

        {/* 새 기록 작성 폼 */}
        <div className="form-container">
          <h2>새 실험 기록 작성</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>실험자: </label>
              <input
                  type="text"
                  name="researcher" // handleInputChange가 이 'name'을 키로 사용
                  value={newEntry.researcher} // 상태와 input 값을 동기화
                  onChange={handleInputChange} // 변경 시 핸들러 연결
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
                  required // HTML5 기본 유효성 검사
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
            <button type="submit">기록 저장</button>
          </form>
        </div>

        {/* 실험 기록 목록 */}
        <div className="entries-list">
          <h2>전체 실험 기록</h2>
          {/* entries 배열을 순회하며 각 entry를 <div>로 렌더링 */}
          {entries.length > 0 ? (
              entries.map(entry => (
                  <div key={entry.id} className="entry-item"> {/* 각 항목은 고유한 key(id)가 필요 */}
                    <h3>{entry.title}</h3>
                    <p><strong>실험자:</strong> {entry.researcher || '미기입'}</p>
                    {/* (참고) whiteSpace: 'pre-wrap'은 DB에 저장된 줄바꿈(\n)을 HTML에 표시해줌 */}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p>
                    <small>작성일: {new Date(entry.createdAt).toLocaleString()}</small>
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