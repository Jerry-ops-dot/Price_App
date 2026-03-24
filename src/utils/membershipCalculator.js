export function applyMembershipBenefits(basePrice, product, memberships, paymentMethod) {
  let finalPrice = basePrice;
  let benefitsApplied = [];
  let originalPrice = basePrice;

  // Assume standard shipping without WOW is 3000
  if (!memberships.coupang && product.isWow) {
    originalPrice += 3000;
    finalPrice += 3000;
  } else if (memberships.coupang && product.isWow) {
    benefitsApplied.push({ text: "🚀 로켓 무배", color: "var(--coupang)" });
    finalPrice = Math.floor(finalPrice * 0.98); // extra subtle wow discount mock
  }

  if (memberships.naver && paymentMethod === 'pay') {
    benefitsApplied.push({ text: "💚 네이버 5% 적립", color: "var(--naver)" });
    finalPrice = Math.floor(finalPrice * 0.95);
  }

  if (memberships.shinsegae && product.hasShinsegaeCoupon) {
    benefitsApplied.push({ text: "⭐ 신세계 쿠폰", color: "var(--shinsegae)" });
    finalPrice = Math.floor(finalPrice * 0.95);
  }

  return {
    originalPrice,
    calculatedPrice: finalPrice,
    benefitsApplied
  };
}
