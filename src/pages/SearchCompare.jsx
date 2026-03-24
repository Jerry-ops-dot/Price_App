import { useState, useEffect, useRef } from 'react';
import { Camera, Search, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { Master_Product, Product_Raw_Data, categoryStandards } from '../mockData/Master_DB';
import { parseUnit, calculateStandardPrice } from '../utils/priceEngine';
import { applyMembershipBenefits } from '../utils/membershipCalculator';
import { runNERPipeline } from '../utils/nerEngine';
import { searchByImage, scanBarcode } from '../utils/visualSearch';

export default function SearchCompare() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userPrefs, setUserPrefs] = useState({ memberships: {}, payment: 'card' });
  const [groupedResults, setGroupedResults] = useState([]);
  const [expandedMaster, setExpandedMaster] = useState(null);
  const [isScanning, setIsScanning] = useState(null);
  const [isSearchingText, setIsSearchingText] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem('pickprice_prefs') || '{}');
    if (prefs.memberships) setUserPrefs(prefs);
    
    // initially load all products grouped by master
    computeAndGroupResults(Product_Raw_Data, prefs, null);
  }, []);
  
  const computeAndGroupResults = (rawData, prefs, targetMasterId) => {
    // 1. Compute prices and unit prices for all raw data
    const computed = rawData.map(product => {
      const priceData = applyMembershipBenefits(product.rawPrice, product, prefs.memberships || {}, prefs.payment || 'card');
      const finalPrice = priceData.calculatedPrice;
      const { totalNum, unit } = parseUnit(product.name);
      
      let standardPriceObj = null;
      let sortPrice = finalPrice; 

      if (totalNum && categoryStandards[product.category]) {
        const stdUnit = categoryStandards[product.category].unit;
        const val = calculateStandardPrice(finalPrice, totalNum, unit, stdUnit);
        if (val) {
          standardPriceObj = { value: val, unit: stdUnit };
          sortPrice = val; 
        }
      }
      return { ...product, priceData, standardPriceObj, sortPrice };
    });
    
    // 2. Group by master_id
    const grouped = {};
    computed.forEach(item => {
      if (!grouped[item.master_id]) {
        grouped[item.master_id] = {
          masterInfo: Master_Product.find(m => m.master_id === item.master_id),
          items: []
        };
      }
      grouped[item.master_id].items.push(item);
    });

    // 3. Sort items inside each group by unit price
    Object.values(grouped).forEach(g => {
      g.items.sort((a, b) => a.sortPrice - b.sortPrice);
    });

    let finalGroups = Object.values(grouped);
    
    // If targetMasterId provided (from NER/Vision), filter to just that master
    if (targetMasterId) {
      finalGroups = finalGroups.filter(g => g.masterInfo.master_id === targetMasterId);
      if (finalGroups.length === 1) {
        setExpandedMaster(targetMasterId);
      }
    }

    setGroupedResults(finalGroups);
  };

  const handleTextSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (!val) {
      computeAndGroupResults(Product_Raw_Data, userPrefs, null);
      setExpandedMaster(null);
      setIsSearchingText(false);
      return;
    }
    
    setIsSearchingText(true);
    setGroupedResults([]); // clear results for "loading" effect

    debounceTimer.current = setTimeout(() => {
      // Run NER NLP Pipeline
      const { matchedMasterId } = runNERPipeline(val);
      
      if (matchedMasterId) {
        computeAndGroupResults(Product_Raw_Data, userPrefs, matchedMasterId);
      } else {
        // Fallback: regular string match on raw data
        const filtered = Product_Raw_Data.filter(p => p.name.includes(val) || p.mall_name.includes(val));
        computeAndGroupResults(filtered, userPrefs, null);
      }
      setIsSearchingText(false);
    }, 500); // 500ms delay to simulate API search
  };

  const handleVisualSearch = () => {
    setIsScanning('image');
    setTimeout(() => {
      setIsScanning(null);
      setSearchTerm('물병 사진 검색됨');
      const match = searchByImage('water bottle');
      if (match) {
        computeAndGroupResults(Product_Raw_Data, userPrefs, match.master_id);
      }
    }, 1500);
  };
  
  const handleBarcodeSearch = () => {
    setIsScanning('barcode');
    setTimeout(() => {
      setIsScanning(null);
      setSearchTerm('바코드 8801234567890');
      const match = scanBarcode('8801234567890');
      if (match) {
        computeAndGroupResults(Product_Raw_Data, userPrefs, match.master_id);
      }
    }, 1500);
  };

  return (
    <div className="page-content animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>정밀 비교/검색 🎯</h1>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="자연어, 쇼핑몰 상품명 검색" 
            value={searchTerm}
            onChange={handleTextSearch}
            style={{ paddingLeft: '2.5rem', border: 'none', boxShadow: 'var(--shadow-sm)' }}
          />
        </div>
        <button onClick={handleVisualSearch} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          <Camera size={20} style={{ color: 'var(--text-main)' }} />
        </button>
        <button onClick={handleBarcodeSearch} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(74, 110, 224, 0.3)' }}>
          <Mic size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isSearchingText && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--primary)', fontWeight: 700 }}>
            결과를 분석 중입니다... 🔄
          </div>
        )}
        {!isSearchingText && groupedResults.length === 0 && <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>검색 결과가 없습니다.</div>}
        
        {!isSearchingText && groupedResults.map((group, idx) => {
          const isExpanded = expandedMaster === group.masterInfo.master_id || groupedResults.length === 1;
          const bestDeal = group.items[0]; // Already sorted by unit price

          return (
            <div key={group.masterInfo.master_id} className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Master Product Header */}
              <div 
                onClick={() => setExpandedMaster(isExpanded ? null : group.masterInfo.master_id)}
                style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: 'var(--surface-color)', position: 'relative' }}
              >
                <div style={{ fontSize: '2.5rem', minWidth: '60px', textAlign: 'center', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                  {group.masterInfo.thumbnail}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.2rem' }}>{group.masterInfo.brand_name}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{group.masterInfo.product_name} <span style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{group.masterInfo.standard_capacity}</span></div>
                  
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    최저 체감가: <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{bestDeal.standardPriceObj?.value}원</span> /{bestDeal.standardPriceObj?.unit}
                  </div>
                </div>
                <div>
                  {isExpanded ? <ChevronUp size={24} color="var(--text-muted)" /> : <ChevronDown size={24} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Collapsed Items List */}
              {isExpanded && (
                <div style={{ background: 'var(--bg-color)', padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>판매처별 체감가 비교 (단위당 가격순)</div>
                  
                  {group.items.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-sm)', border: i === 0 ? '1px solid var(--secondary)' : '1px solid transparent', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                      {i === 0 && <div style={{ position: 'absolute', top: '-8px', left: '-8px', background: 'var(--secondary)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>최저가</div>}
                      
                      <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-main)' }}>{item.mall_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{item.name}</div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                          {item.priceData.benefitsApplied.map((b, _idx) => (
                            <span key={_idx} style={{ fontSize: '0.6rem', color: b.color, background: 'var(--surface-color)', padding: '0.1rem 0.3rem', borderRadius: '2px', border: `1px solid ${b.color}40`, fontWeight: 600 }}>{b.text}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.priceData.calculatedPrice.toLocaleString()}<span style={{fontSize:'0.8rem'}}>원</span></div>
                        {item.standardPriceObj && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.2rem' }}>
                            {item.standardPriceObj.value}원 <span style={{fontWeight:400, color:'var(--text-muted)'}}>/{item.standardPriceObj.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isScanning && (
        <div className="scanning-overlay">
          <div className="scanner-box">
            <div className="scanner-line"></div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isScanning === 'image' ? '📸 상품을 분석하고 있습니다...' : '📠 바코드를 인식 중입니다...'}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>잠시만 기다려주세요</p>
        </div>
      )}
    </div>
  );
}
