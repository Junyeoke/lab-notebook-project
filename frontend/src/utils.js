// 유틸리티 함수
export const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        console.error("날짜 포맷팅 오류:", e);
        return 'Invalid Date';
    }
};

// Base64 -> File 객체 변환 헬퍼
export const dataURLtoFile = (dataurl, filename) => {
    if (!dataurl) return null;
    try {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("dataURLtoFile 변환 오류:", e);
        return null;
    }
}

export const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

export const getOriginalFileName = (storedFileName) => {
    if (!storedFileName) return '';
    const parts = storedFileName.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : storedFileName;
};
