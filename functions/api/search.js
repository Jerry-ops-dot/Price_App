function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>?/g, '');
}

function inferCategory(title) {
  const normalized = title.toLowerCase();
  if (/(생수|물|water|콜라|우유|ml|l\b)/i.test(normalized)) return 'drink';
  if (/(햇반|밥|쌀|g\b|kg\b)/i.test(normalized)) return 'fresh';
  if (/(휴지|화장지|크리넥스|롤|m\b)/i.test(normalized)) return 'living';
  return 'external';
}

function toInt(value) {
  const numeric = String(value || '').replace(/[^0-9]/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function pickItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.data?.products)) return payload.data.products;
  if (Array.isArray(payload.result?.items)) return payload.result.items;
  if (Array.isArray(payload.result?.products)) return payload.result.products;
  return [];
}

function buildTemplateUrl(template, query, apiKey = '') {
  return template
    .replaceAll('{query}', encodeURIComponent(query))
    .replaceAll('{rawQuery}', query)
    .replaceAll('{apiKey}', encodeURIComponent(apiKey));
}

function makeExternalDeal(source, item, index) {
  const cleanTitle = stripHtml(firstDefined(item.title, item.prodName, item.productName, item.name, item.goodsName));
  const mallName = stripHtml(firstDefined(item.mallName, item.mall_name, item.shopName, item.sellerName, item.companyName, source.label));
  const rawPrice = toInt(firstDefined(item.lprice, item.lowPrice, item.minPrice, item.price, item.salePrice, item.avgPrice));

  if (!cleanTitle || !rawPrice) return null;

  const link = firstDefined(item.link, item.url, item.productUrl, item.prodUrl, item.goodsUrl);
  const image = firstDefined(item.image, item.imageUrl, item.imgUrl, item.thumbUrl, item.thumbnail);
  const catalogFlag = Boolean(item.isCatalog || item.productType === '2' || source.id !== 'naver');

  return {
    id: `${source.id}_${index}`,
    master_id: 'M_EXTERNAL',
    mall_name: mallName.includes(source.label) ? mallName : `${source.label} · ${mallName}`,
    name: cleanTitle,
    rawPrice,
    isWow: mallName.includes('쿠팡'),
    isNaverFresh: source.id === 'naver' || mallName.includes('네이버'),
    hasShinsegaeCoupon: mallName.includes('SSG') || mallName.includes('이마트'),
    category: inferCategory(cleanTitle),
    link,
    image,
    source: source.id,
    sourceLabel: source.label,
    isCatalog: catalogFlag
  };
}

async function searchNaver(query, env) {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) return [];

  const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20`, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET
    }
  });

  if (!res.ok) throw new Error(`Naver API failed: ${res.status}`);
  const data = await res.json();
  return pickItems(data)
    .map((item, index) => makeExternalDeal({ id: 'naver', label: '네이버' }, item, index))
    .filter(Boolean);
}

async function searchTemplateProvider(query, env, source) {
  const template = env[source.templateEnv];
  if (!template) return [];

  const res = await fetch(buildTemplateUrl(template, query, env[source.keyEnv]));
  if (!res.ok) throw new Error(`${source.label} API failed: ${res.status}`);

  const data = await res.json();
  return pickItems(data)
    .map((item, index) => makeExternalDeal(source, item, index))
    .filter(Boolean);
}

async function searchExternalProviders(query, env) {
  const providers = [
    () => searchNaver(query, env),
    () => searchTemplateProvider(query, env, {
      id: 'danawa',
      label: '다나와',
      templateEnv: 'DANAWA_SEARCH_URL_TEMPLATE',
      keyEnv: 'DANAWA_API_KEY'
    }),
    () => searchTemplateProvider(query, env, {
      id: 'enuri',
      label: '에누리',
      templateEnv: 'ENURI_SEARCH_URL_TEMPLATE',
      keyEnv: 'ENURI_API_KEY'
    })
  ];

  const settled = await Promise.allSettled(providers.map(provider => provider()));
  settled.forEach(result => {
    if (result.status === 'rejected') {
      console.error('External search provider failed:', result.reason);
    }
  });

  return settled
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value)
    .slice(0, 60);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const masterId = url.searchParams.get('master_id');

  try {
    const db = context.env.DB;
    // 1. Fetch Local Master Data
    const mastersData = await db.prepare("SELECT * FROM masters").all();
    
    // 2. Fetch Deals: Search configured external providers in parallel.
    if (query) {
      const externalDeals = await searchExternalProviders(query, context.env);
      if (externalDeals.length > 0) {
        const activeSources = [...new Set(externalDeals.map(deal => deal.sourceLabel))].join(' + ');
        const activeMaster = {
          master_id: 'M_EXTERNAL',
          brand_name: `${activeSources} 실시간`,
          product_name: `검색어: ${query}`,
          standard_capacity: '',
          barcode_number: '',
          thumbnail: externalDeals.find(deal => deal.image)?.image || '🌐',
          category: 'external'
        };

        return Response.json({
          masters: [...mastersData.results, activeMaster],
          deals: externalDeals
        });
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
