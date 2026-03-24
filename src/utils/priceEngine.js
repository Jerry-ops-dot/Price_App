// 핵심 상품 기본 용량 사전 (판매자가 중량을 누락했을 때 참조)
const MASTER_DICTIONARY = [
  { keyword: '햇반', defaultAmount: 210, defaultUnit: 'g' },
  { keyword: '신라면', defaultAmount: 120, defaultUnit: 'g' },
  { keyword: '삼다수', defaultAmount: 2000, defaultUnit: 'ml' },
  { keyword: '코카콜라', defaultAmount: 355, defaultUnit: 'ml' },
  { keyword: '짜파게티', defaultAmount: 140, defaultUnit: 'g' },
  { keyword: '크리넥스', defaultAmount: 30, defaultUnit: 'm' },
  { keyword: '스팸', defaultAmount: 200, defaultUnit: 'g' },
  { keyword: '동원참치', defaultAmount: 150, defaultUnit: 'g' },
];

export function parseUnit(name) {
  let totalNum = null;
  let unit = null;

  // 1. 단위를 포함한 상세 정규식 (박스, 묶음, 포, 구 등 한국어 포장 단위 대폭 확대)
  const match = name.match(/([0-9.]+)\s*(L|ml|g|kg|m(?:m)?)\s*(?:x?\s*([0-9]+)\s*(?:개|롤|입|병|캔|팩|묶음|포|구|박스))?/i);
  
  if (match) {
    let amount = parseFloat(match[1]);
    const rawUnit = match[2].toLowerCase();
    const count = match[3] ? parseInt(match[3], 10) : 1;

    if (rawUnit === 'l') { amount *= 1000; unit = 'ml'; }
    else if (rawUnit === 'kg') { amount *= 1000; unit = 'g'; }
    else { unit = rawUnit; }

    totalNum = amount * count;
    return { totalNum, unit };
  }

  // 2. 수량만 표기된 경우 파싱 ("사과 10개", "콜라 30캔")
  const countMatch = name.match(/([0-9]+)\s*(?:개|입|병|캔|팩|롤|묶음|포|구|박스)/i);
  let parsedCount = countMatch ? parseInt(countMatch[1], 10) : 1;

  // 3. 마스터 사전 참조 로직 (상품명에 키워드가 포함되어 있고 용량 기재가 없는 경우)
  for (const master of MASTER_DICTIONARY) {
    if (name.includes(master.keyword)) {
      totalNum = master.defaultAmount * parsedCount;
      unit = master.defaultUnit;
      return { totalNum, unit };
    }
  }

  // 4. 사전에도 없고 수량만 있는 경우
  if (countMatch) {
    return { totalNum: parsedCount, unit: '개' };
  }

  return { totalNum: null, unit: null };
}

export function calculateStandardPrice(price, totalNum, unit, categoryStandardUnitStr) {
  if (!totalNum || !categoryStandardUnitStr) return null;
  
  // 영문자(ml, g)뿐만 아니라 한글(개, 롤) 단위도 파싱하도록 숫자+그외문자 배열로 스플릿
  const standardMatch = categoryStandardUnitStr.match(/([0-9.]+)(.*)/);
  if (!standardMatch) return null;
  
  const standardAmount = parseFloat(standardMatch[1]);
  const perUnit = price / totalNum;
  
  return Math.round(perUnit * standardAmount);
}
