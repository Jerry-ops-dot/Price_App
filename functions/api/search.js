export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const masterId = url.searchParams.get('master_id');

  const clientId = context.env.NAVER_CLIENT_ID;
  const clientSecret = context.env.NAVER_CLIENT_SECRET;

  try {
    const db = context.env.DB;
    // 1. Fetch Local Master Data
    const mastersData = await db.prepare("SELECT * FROM masters").all();
    
    // 2. Fetch Deals: Try Naver API FIRST if searching by text
    if (query && clientId && clientSecret) {
      try {
        const naverRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20`, {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret
          }
        });
        
        if (naverRes.ok) {
          const naverData = await naverRes.json();
          if (naverData.items.length > 0) {
            const deals = naverData.items.map((item, index) => {
              const catalogFlag = item.productType === '2' || item.mallName === '네이버';
              return {
                id: `naver_${index}`,
                master_id: 'M_EXTERNAL', 
                mall_name: catalogFlag ? '네이버 가격비교' : item.mallName,
                name: item.title.replace(/<[^>]*>?/g, ''), 
                rawPrice: parseInt(item.lprice, 10),
                isWow: item.mallName.includes('쿠팡'), 
                isNaverFresh: item.mallName.includes('네이버'), 
                hasShinsegaeCoupon: item.mallName.includes('SSG') || item.mallName.includes('이마트'),
                category: 'external',
                link: item.link,
                image: item.image,
                isCatalog: catalogFlag
              };
            });
            
            if (deals.length > 0) {
              const activeMaster = {
                master_id: 'M_EXTERNAL',
                brand_name: '네이버 쇼핑 실시간',
                product_name: `검색어: ${query}`,
                standard_capacity: '',
                barcode_number: '',
                thumbnail: deals[0].image || '🌐',
                category: 'external'
              };
              
              return Response.json({
                masters: [...mastersData.results, activeMaster],
                deals: deals
              });
            }
          }
        }
      } catch(err) {
        console.error("Naver API failed, falling back to local DB.", err);
      }
    }
    
    // 3. Fallback to Local D1 database query
    let dealsData;
    if (masterId) {
       dealsData = await db.prepare("SELECT * FROM deals WHERE master_id = ?").bind(masterId).all();
    } else if (query) {
       dealsData = await db.prepare(
        "SELECT * FROM deals WHERE name LIKE ? OR mall_name LIKE ? OR master_id IN (SELECT master_id FROM masters WHERE product_name LIKE ? OR brand_name LIKE ?)"
      ).bind(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`).all();
    } else {
      dealsData = await db.prepare("SELECT * FROM deals").all();
    }
    
    const deals = dealsData.results.map(d => ({
      ...d,
      isWow: Boolean(d.isWow),
      isNaverFresh: Boolean(d.isNaverFresh),
      hasShinsegaeCoupon: Boolean(d.hasShinsegaeCoupon),
      isCatalog: false
    }));
    
    return Response.json({
      masters: mastersData.results,
      deals: deals
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
