import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, ShoppingBag, CreditCard } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState({
    coupang: false,
    naver: false,
    shinsegae: false
  });
  const [payment, setPayment] = useState('card');

  useEffect(() => {
    const saved = localStorage.getItem('pickprice_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      if (prefs.memberships) setMemberships(prefs.memberships);
      if (prefs.payment) setPayment(prefs.payment);
    }
  }, []);

  const toggleMembership = (key) => {
    setMemberships(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem('pickprice_prefs', JSON.stringify({ memberships, payment }));
    // trigger a quick checkmark animation then navigate
    setTimeout(() => {
      navigate('/');
    }, 200);
  };

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>MY 혜택 설정 🎯</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          자주 사용하는 멤버십과 결제 수단을 선택하면 <br/>
          <strong style={{ color: 'var(--primary)' }}>나만의 진짜 최저가</strong>를 찾아드려요!
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
