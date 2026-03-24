import { useState, useEffect } from 'react';
import { getAISuggestions } from '../utils/aiPrediction';
import { applyMembershipBenefits } from '../utils/membershipCalculator';
import { Sparkles, Gift } from 'lucide-react';

export default function DiscoveryFeed() {
  const [suggestions, setSuggestions] = useState([]);
  const [userPrefs, setUserPrefs] = useState({ memberships: {}, payment: 'card' });
  const [toast, setToast] = useState(null);

  const handleBuy = (itemName) => {
    setToast(`${itemName} 상품을 장바구니에 담았습니다! 🛒`);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem('pickprice_prefs') || '{}');
    if (prefs.memberships) setUserPrefs(prefs);
    
    // Load predictions
    setSuggestions(getAISuggestions());
  }, []);

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>맞춤 발견 🔮</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>AI가 분석한 체감 최저가 딜</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {suggestions.map(item => {
          const { originalPrice, calculatedPrice, benefitsApplied } = applyMembershipBenefits(
            item.rawPrice, item, userPrefs.memberships || {}, userPrefs.payment || 'card'
          );

          return (
            <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(74, 110, 224, 0.1)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} />
                {item.reason}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontSize: '3rem', minWidth: '60px', textAlign: 'center' }}>{item.image}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{item.name}</h3>
                  <div style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {originalPrice.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    {calculatedPrice.toLocaleString()}<span style={{ fontSize: '1rem' }}>원</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                       ({Math.round((1 - calculatedPrice / originalPrice) * 100)}% 체감할인)
                    </span>
                  </div>
                </div>
              </div>

              {benefitsApplied.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {benefitsApplied.map((benefit, i) => (
                    <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-color)', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 600, color: benefit.color }}>
                      {benefit.text}
                    </span>
                  ))}
                </div>
              )}
              
              <button 
                className="btn btn-primary" 
                onClick={() => handleBuy(item.name)}
                style={{ width: '100%', marginTop: '0.5rem', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}
              >
                체감가로 구매하기
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
