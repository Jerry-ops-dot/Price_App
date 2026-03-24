import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, ShoppingBag, CreditCard, LogOut, Clock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser, fetchUser, loading } = useAuth();
  
  const [memberships, setMemberships] = useState({ coupang: false, naver: false, shinsegae: false });
  const [payment, setPayment] = useState('card');
  const [history, setHistory] = useState([]);
  
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('pickprice_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      if (prefs.memberships) setMemberships(prefs.memberships);
      if (prefs.payment) setPayment(prefs.payment);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/history')
        .then(r => r.json())
        .then(d => { if (d.history) setHistory(d.history); })
        .catch(console.error);
    }
  }, [user]);

  const toggleMembership = (key) => setMemberships(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSave = () => {
    localStorage.setItem('pickprice_prefs', JSON.stringify({ memberships, payment }));
    setTimeout(() => navigate('/'), 200);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '인증에 실패했습니다.');
      
      if (authMode === 'signup') {
        setAuthMode('login');
        setAuthError('회원가입 완료! 이제 로그인해주세요.');
      } else {
        await fetchUser(); // Update context
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div style={{textAlign:'center', padding:'4rem', color:'var(--text-muted)'}}>인증 정보를 확인 중입니다...</div>;

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '6rem' }}>
      
      {!user ? (
        <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
            <UserIcon size={18} color="var(--primary)" /> {authMode === 'login' ? '계정 로그인' : '간편 회원가입'}
          </h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <input type="text" placeholder="아이디 (4자 이상)" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} required minLength={4} />
            <input type="password" placeholder="비밀번호 (4자 이상)" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} required minLength={4} />
            {authError && <div style={{ color: authError.includes('완료') ? 'var(--primary)' : 'var(--shinsegae)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.2rem' }}>{authError}</div>}
            <button type="submit" style={{ padding: '1rem', background: 'var(--text-main)', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
              {authMode === 'login' ? '로그인' : '가입하기'}
            </button>
          </form>
          <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
              {authMode === 'login' ? '회원가입' : '로그인'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '2.5rem', padding: '1.2rem 1.5rem', background: 'var(--primary)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 12px rgba(74, 110, 224, 0.2)' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>반갑습니다, {user.username}님! 👋</h2>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.3rem' }}>오늘도 알뜰한 쇼핑 되세요.</div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      )}

      {user && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            <Clock size={16} /> 최근 검색 및 조회 기록
          </h2>
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 1rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)' }}>최근에 검색한 상품이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              {history.map(h => (
                <div key={h.id} style={{ minWidth: '94px', maxWidth: '94px', flexShrink: 0, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/?q=${encodeURIComponent(h.search_query)}`)}>
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {h.thumbnail ? <img src={h.thumbnail} alt={h.search_query} style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ fontSize: '2rem' }}>🔍</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }}>{h.search_query}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800, color: 'var(--text-main)' }}>할인 혜택 매핑 설정</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          자주 사용하는 멤버십과 결제 수단을 설정하면 <br/>
          <strong>회원님만의 맞춤형 최저가</strong>가 자동 계산됩니다.
        </p>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> 
          구독 중인 이커머스 멤버십
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => toggleMembership('coupang')}
            className={`glass-panel btn-choice ${memberships.coupang ? 'active' : ''}`}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '1.25rem', border: memberships.coupang ? `2px solid var(--coupang)` : '2px solid transparent',
              transition: 'all 0.2s', width: '100%', cursor: 'pointer', textAlign: 'left', background: memberships.coupang ? 'rgba(0,136,204,0.05)' : ''
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ color: 'var(--coupang)', fontWeight: '900', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>C</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.1rem' }}>쿠팡 로켓와우</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>배송비 0원 & 와우할인 적용</div>
              </div>
            </div>
            {memberships.coupang && <div style={{ background: 'var(--coupang)', color: 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex' }}><Check size={16} strokeWidth={3} /></div>}
          </button>

          <button 
            onClick={() => toggleMembership('naver')}
            className={`glass-panel btn-choice ${memberships.naver ? 'active' : ''}`}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '1.25rem', border: memberships.naver ? `2px solid var(--naver)` : '2px solid transparent',
              transition: 'all 0.2s', width: '100%', cursor: 'pointer', textAlign: 'left', background: memberships.naver ? 'rgba(3,199,90,0.05)' : ''
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ color: 'var(--naver)', fontWeight: '900', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>N</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.1rem' }}>네이버플러스 멤버십</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>슈퍼적립 5~10% 혜택 적용</div>
              </div>
            </div>
            {memberships.naver && <div style={{ background: 'var(--naver)', color: 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex' }}><Check size={16} strokeWidth={3} /></div>}
          </button>

          <button 
            onClick={() => toggleMembership('shinsegae')}
            className={`glass-panel btn-choice ${memberships.shinsegae ? 'active' : ''}`}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '1.25rem', border: memberships.shinsegae ? `2px solid var(--shinsegae)` : '2px solid transparent',
              transition: 'all 0.2s', width: '100%', cursor: 'pointer', textAlign: 'left', background: memberships.shinsegae ? 'rgba(255,0,0,0.05)' : ''
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ color: 'var(--shinsegae)', fontWeight: '900', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>S</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.1rem' }}>신세계 유니버스 클럽</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5% 즉시 추가 할인 쿠폰 적용</div>
              </div>
            </div>
            {memberships.shinsegae && <div style={{ background: 'var(--shinsegae)', color: 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex' }}><Check size={16} strokeWidth={3} /></div>}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <CreditCard size={18} style={{ color: 'var(--primary)' }} /> 
          주 결제 수단
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['card', 'pay', 'transfer'].map(type => (
            <button
              key={type}
              onClick={() => setPayment(type)}
              style={{
                flex: 1,
                padding: '1rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: payment === type ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                background: payment === type ? 'rgba(74, 110, 224, 0.05)' : 'var(--surface-color)',
                color: payment === type ? 'var(--primary)' : 'var(--text-main)',
                transition: 'all 0.2s',
                fontWeight: 600,
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: payment === type ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {type === 'card' ? '신용/체크카드' : type === 'pay' ? '간편결제' : '계좌이체'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '80px', left: 0, right: 0, padding: '0 1.5rem', maxWidth: '480px', margin: '0 auto', zIndex: 50 }}>
        <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)' }}>
          저장하고 진짜 최저가 보기 <ShoppingBag size={20} />
        </button>
      </div>
    </div>
  );
}
