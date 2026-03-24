import { useState, useEffect, useRef } from 'react';
import { Camera, Search, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { parseUnit, calculateStandardPrice } from '../utils/priceEngine';
import { applyMembershipBenefits } from '../utils/membershipCalculator';
import { runNERPipeline } from '../utils/nerEngine';
import { searchByImage, scanBarcode } from '../utils/visualSearch';

// We now only import categoryStandards, masters/deals come from API
import { categoryStandards } from '../mockData/Master_DB';

export default function SearchCompare() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userPrefs, setUserPrefs] = useState({ memberships: {}, payment: 'card' });
  const [groupedResults, setGroupedResults] = useState([]);
  const [expandedMaster, setExpandedMaster] = useState(null);
  const [isScanning, setIsScanning] = useState(null);
  const [isSearchingText, setIsSearchingText] = useState(false);
  const [searchStep, setSearchStep] = useState('input'); // 'input', 'select_product', 'view_deals'
  const [productCandidates, setProductCandidates] = useState([]);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem('pickprice_prefs') || '{}');
    if (prefs.memberships) setUserPrefs(prefs);
    
    // Wait for user input to show product candidates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchAndGroupResults = async (query = '', targetMasterId = null, currentPrefs = userPrefs, customThumbnail = null) => {
    setIsSearchingText(true);
    // setGroupedResults([]); // Optional: keep old results until new arrive, but clearing feels snappy

    try {
      let url = '/api/search';
      if (targetMasterId) {
        url += `?master_id=${targetMasterId}`;
      } else if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('API Request Failed');
      const { masters, deals } = await res.json();

      // 1. Compute prices and unit prices for all raw data
      const computed = deals.map(product => {
        const priceData = applyMembershipBenefits(product.rawPrice, product, currentPrefs.memberships || {}, currentPrefs.payment || 'card');
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
            masterInfo: masters.find(m => m.master_id === item.master_id) || { master_id: item.master_id, product_name: 'Unknown', brand_name: '', thumbnail: '🎁' },
            items: []
          };
          if (customThumbnail) {
            grouped[item.master_id].masterInfo.thumbnail = customThumbnail;
          }
          grouped[item.master_id].masterInfo.product_name = query;
          grouped[item.master_id].masterInfo.brand_name = '최저가 비교 결과 ✅';
        }
        grouped[item.master_id].items.push(item);
      });

      // 3. Sort items inside each group by unit price and keep only top 5 cheapest
      Object.values(grouped).forEach(g => {
        g.items.sort((a, b) => a.sortPrice - b.sortPrice);
        g.items = g.items.slice(0, 5);
      });

      let finalGroups = Object.values(grouped);
      
      if (targetMasterId && finalGroups.length === 1) {
        setExpandedMaster(targetMasterId);
      }

      setGroupedResults(finalGroups);
    } catch (e) {
      console.error(e);
      setGroupedResults([]);
    } finally {
      setIsSearchingText(false);
    }
  };

  const fetchProductCandidates = async (query) => {
    setIsSearchingText(true);
    setSearchStep('select_product');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('API Request Failed');
      const { deals } = await res.json();
      
      const uniqueDeals = [];
      const titles = new Set();
      for (const d of deals) {
        if (!titles.has(d.name)) {
          uniqueDeals.push(d);
          titles.add(d.name);
        }
      }
      setProductCandidates(uniqueDeals.slice(0, 10)); // Top 10 unique products
    } catch (e) {
      console.error(e);
      setProductCandidates([]);
    } finally {
      setIsSearchingText(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSearchStep('view_deals');
    setSearchTerm(product.name);
    // Search absolute deals for this exact product title
    fetchAndGroupResults(product.name, null, userPrefs, product.image);
  };

  const handleTextSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (!val) {
      setSearchStep('input');
      setProductCandidates([]);
      setIsSearchingText(false);
      setGroupedResults([]);
      return;
    }
    
    setIsSearchingText(true);
    setSearchStep('select_product');
    setProductCandidates([]);

    debounceTimer.current = setTimeout(() => {
      fetchProductCandidates(val);
    }, 500); // 500ms debounce
  };

  const handleVisualSearch = () => {
    setIsScanning('image');
    setTimeout(() => {
      setIsScanning(null);
      setSearchTerm('물병 사진 검색됨');
      const match = searchByImage('water bottle');
      if (match) {
        fetchAndGroupResults('', match.master_id);
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
        fetchAndGroupResults('', match.master_id);
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
        {/* Step 1: Loading Product List */}
        {isSearchingText && searchStep === 'select_product' && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🔄</div>
            <div>네이버 쇼핑 제품 목록을 불러오는 중입니다...</div>
          </div>
        )}

        {/* Step 2: Product Candidates UI */}
        {!isSearchingText && searchStep === 'select_product' && productCandidates.length > 0 && (
          <div style={{ marginTop: '0.5rem', paddingBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>정확하게 어떤 제품을 찾으시나요? 👇</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {productCandidates.map((product, idx) => (
                <div 
                  key={`cand_${idx}`} 
                  onClick={() => handleSelectProduct(product)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}
                >
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={product.image || 'https://via.placeholder.com/60'} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>👈 클릭하여 판매처별 최저가 비교</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Prices State */}
        {isSearchingText && searchStep === 'view_deals' && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>🔄</div>
            <div>선택하신 제품의 쇼핑몰별 최저가를 분석 중입니다...</div>
          </div>
        )}

        {/* Empty State */}
        {!isSearchingText && searchStep === 'select_product' && productCandidates.length === 0 && searchTerm && (
          <div style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>검색 결과가 없습니다.</div>
        )}

        {/* Step 3: View Deals (Grouped Results) */}
        {!isSearchingText && searchStep === 'view_deals' && groupedResults.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => { setSearchStep('select_product'); setGroupedResults([]); setSearchTerm(''); fetchProductCandidates(''); }} 
              style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(74, 110, 224, 0.3)' }}
            >
              ← 다른 제품 다시 찾기
            </button>
          </div>
        )}
        
        {!isSearchingText && searchStep === 'view_deals' && groupedResults.map((group, idx) => {
          const isExpanded = expandedMaster === group.masterInfo.master_id || groupedResults.length === 1;
          const bestDeal = group.items[0]; // Already sorted by unit price

          return (
            <div key={group.masterInfo.master_id} className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Master Product Header */}
              <div 
                onClick={() => setExpandedMaster(isExpanded ? null : group.masterInfo.master_id)}
                style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: 'var(--surface-color)', position: 'relative' }}
              >
                <div style={{ fontSize: '2.5rem', minWidth: '60px', width: '60px', height: '60px', textAlign: 'center', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: typeof group.masterInfo.thumbnail === 'string' && group.masterInfo.thumbnail.startsWith('http') ? '0' : '0.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {typeof group.masterInfo.thumbnail === 'string' && group.masterInfo.thumbnail.startsWith('http') ? (
                    <img src={group.masterInfo.thumbnail} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    group.masterInfo.thumbnail
                  )}
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
                        {item.link && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}>쇼핑몰 이동 🚀</a>
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
