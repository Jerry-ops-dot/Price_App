export const mockProducts = [
  { id: 1, name: "삼다수 2L x 6개", rawPrice: 5900, image: "💧", category: "drink", isWow: true, isNaverFresh: false, hasShinsegaeCoupon: true },
  { id: 2, name: "햇반 210g x 3개", rawPrice: 3800, image: "🍚", category: "fresh", isWow: true, isNaverFresh: true, hasShinsegaeCoupon: false },
  { id: 3, name: "크리넥스 3겹 화장지 30m x 30롤", rawPrice: 21900, image: "🧻", category: "living", isWow: false, isNaverFresh: true, hasShinsegaeCoupon: true },
  { id: 4, name: "오리온 초코파이 39g x 12개", rawPrice: 4800, image: "🍫", category: "fresh", isWow: true, isNaverFresh: true, hasShinsegaeCoupon: false },
];

export const categoryStandards = {
  drink: { unit: '100ml', emoji: '🥤' },
  fresh: { unit: '100g', emoji: '🍳' },
  living: { unit: '10m', emoji: '🏠' }
};
