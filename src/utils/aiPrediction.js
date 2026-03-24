import { Product_Raw_Data } from '../mockData/Master_DB';

export function getAISuggestions() {
  return [
    {
      ...Product_Raw_Data[0],
      reason: "💡 AI 예측: 생수가 떨어질 때가 되었어요 (구매 후 14일 경과)"
    },
    {
      ...Product_Raw_Data[5],
      reason: "🚨 특가 알림: 화장지 가격이 평소보다 15% 저렴해요!"
    }
  ];
}
