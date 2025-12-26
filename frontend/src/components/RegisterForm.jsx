// frontend/src/components/RegisterForm.jsx
import React, { useState } from 'react';

const RegisterForm = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    login_id: '',
    name: '',
    password: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원가입이 완료되었습니다! 로그인해 주세요.');
        // 가입 성공 시 로그인 화면으로 이동시키기 위한 콜백
        if (onRegisterSuccess) onRegisterSuccess(); 
      } else {
        alert(data.message || '회원가입 실패');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label>아이디</label>
          <input
            name="login_id"
            placeholder="사용할 아이디"
            value={formData.login_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>이름</label>
          <input
            name="name"
            placeholder="실명 또는 닉네임"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>비밀번호</label>
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="input-group">
          <label>이메일</label>
          <input
            name="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
