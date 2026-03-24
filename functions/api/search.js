export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const masterId = url.searchParams.get('master_id');

  const clientId = context.env.NAVER_CLIENT_ID;
  const clientSecret = context.env.NAVER_CLIENT_SECRET;
  const serpapiKey = context.env.SERPAPI_KEY;

  try {
    const db = context.env.DB;
    // 1. Fetch Local Master Data
    const mastersData = await db.prepare("SELECT * FROM masters").all();
    
    // 2. Fetch Deals: Try External APIs FIRST if searching by text
    if (query && (clientId || serpapiKey)) {
      try {
        const fetchPromises = [];
        
        // Queue Naver
        if (clientId && clientSecret) {
          fetchPromises.push(
            fetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=15`, {
              headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
            }).then(r => r.json()).catch(() => null)
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        // Queue SerpApi (Google Shopping)
        if (serpapiKey) {
          fetchPromises.push(
            fetch(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${serpapiKey}&gl=kr&hl=ko`)
            .then(r => r.json()).catch(() => null)
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        const [naverData, googleData] = await Promise.all(fetchPromises);
        let combinedDeals = [];

        // Parse Naver
        if (naverData && naverData.items) {
          // Filter out Catalog (productType === '2') items because their prices are aggregate lowest (often bait-and-switch)
          const validNaverItems = naverData.items.filter(item => item.productType !== '2' && item.mallName !== '네이버');
          
          combinedDeals.push(...validNaverItems.map((item, i) => ({
            id: `naver_${i}`,
            master_id: 'M_EXTERNAL', 
            mall_name: item.mallName,
            name: item.title.replace(/<[^>]*>?/g, ''), 
            rawPrice: parseInt(item.lprice, 10),
            isWow: item.mallName.includes('쿠팡'),
            isNaverFresh: false, // filtered out Naver catalog so it's irrelevant
            hasShinsegaeCoupon: item.mallName.includes('SSG') || item.mallName.includes('이마트'),
            category: 'external',
            link: item.link,
            image: item.image,
            searchSource: 'naver'
          })));
        }

        // Parse Google
        if (googleData && googleData.shopping_results) {
          combinedDeals.push(...googleData.shopping_results.map((item, i) => {
             const price = item.extracted_price || parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0;
             return {
              id: `google_${i}`,
              master_id: 'M_EXTERNAL', 
              mall_name: item.source || '구글쇼핑',
              name: item.title,
              rawPrice: price,
              isWow: (item.source || '').includes('쿠팡'),
              isNaverFresh: (item.source || '').includes('네이버'),
              hasShinsegaeCoupon: (item.source || '').includes('SSG') || (item.source || '').includes('이마트'),
              category: 'external',
              link: item.link,
              image: item.thumbnail,
              searchSource: 'google'
            };
          }).filter(d => d.rawPrice > 0)); // Filter out invalid prices
        }

        // Sort Combined Deals by absolute lowest price
        combinedDeals.sort((a, b) => a.rawPrice - b.rawPrice);

        if (combinedDeals.length > 0) {
          const activeMaster = {
            master_id: 'M_EXTERNAL',
            brand_name: '네이버/구글 통합 최저가',
            product_name: `검색어: ${query}`,
            standard_capacity: '',
            barcode_number: '',
            thumbnail: combinedDeals[0].image || '🌐',
            category: 'external'
          };
          
          return Response.json({
            masters: [...mastersData.results, activeMaster],
            deals: combinedDeals
          });
        }
      } catch(err) {
        console.error("External APIs failed, falling back to local DB.", err);
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
      hasShinsegaeCoupon: Boolean(d.hasShinsegaeCoupon)
    }));
    
    return Response.json({
      masters: mastersData.results,
      deals: deals
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
