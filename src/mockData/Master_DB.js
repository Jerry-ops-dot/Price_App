// Master Specification Database
export const Master_Product = [
  { master_id: 'M1001', brand_name: '제주삼다수', product_name: '삼다수', standard_capacity: '2L', barcode_number: '8801234567890', thumbnail: '💧', category: 'drink' },
  { master_id: 'M1002', brand_name: 'CJ제일제당', product_name: '햇반', standard_capacity: '210g', barcode_number: '8800987654321', thumbnail: '🍚', category: 'fresh' },
  { master_id: 'M1003', brand_name: '유한킴벌리', product_name: '크리넥스 3겹 데코앤소프트', standard_capacity: '30m', barcode_number: '8801122334455', thumbnail: '🧻', category: 'living' }
];

// Raw Data from various Malls mapped by FK (master_id)
export const Product_Raw_Data = [
  // M1001 Deals
  { id: 101, master_id: 'M1001', mall_name: '쿠팡 로켓배송', name: "제주 삼다수 2L x 6개", rawPrice: 5900, isWow: true, isNaverFresh: false, hasShinsegaeCoupon: false, category: 'drink' },
  { id: 102, master_id: 'M1001', mall_name: '네이버 장보기', name: "동원 무라벨 제주삼다수 2L 12개", rawPrice: 11500, isWow: false, isNaverFresh: true, hasShinsegaeCoupon: false, category: 'drink' },
  { id: 103, master_id: 'M1001', mall_name: 'SSG 쓱배송', name: "[이마트] 삼다수 2L 6개입", rawPrice: 6200, isWow: false, isNaverFresh: false, hasShinsegaeCoupon: true, category: 'drink' },
  
  // M1002 Deals
  { id: 201, master_id: 'M1002', mall_name: '쿠팡 로켓배송', name: "CJ 햇반 210g x 12개", rawPrice: 14500, isWow: true, isNaverFresh: false, hasShinsegaeCoupon: false, category: 'fresh' },
  { id: 202, master_id: 'M1002', mall_name: '네이버 장보기', name: "햇반 백미 210g 24개", rawPrice: 28000, isWow: false, isNaverFresh: true, hasShinsegaeCoupon: false, category: 'fresh' },
  
  // M1003 Deals
  { id: 301, master_id: 'M1003', mall_name: 'SSG 쓱배송', name: "크리넥스 데코앤소프트 30m 30롤", rawPrice: 21900, isWow: false, isNaverFresh: false, hasShinsegaeCoupon: true, category: 'living' }
];

export const categoryStandards = {
  drink: { unit: '100ml', emoji: '🥤' },
  fresh: { unit: '100g', emoji: '🍳' },
  living: { unit: '10m', emoji: '🏠' }
};
