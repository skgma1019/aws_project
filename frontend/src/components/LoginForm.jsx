import React, { useState } from 'react';

const LoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ login_id: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('로그인 성공!');
        // 🚨 중요: 로그인 성공 후 사용자 정보를 상위 컴포넌트로 전달하거나 저장
        onLoginSuccess(data.user_id); 
      } else {
        alert(data.message || '로그인 실패');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          name="login_id"
          placeholder="아이디"
          value={formData.login_id}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="비밀번호"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
