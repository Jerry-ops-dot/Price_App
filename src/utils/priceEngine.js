export function parseUnit(name) {
  let totalNum = null;
  let unit = null;

  // 정규식 개선: "2L 12개", "500ml x 20", "1.5 L 6병", "210g 24입" 처럼 x가 없어도 수량(개,입,병 등)을 파악하도록 강화
  const match = name.match(/([0-9.]+)\s*(L|ml|g|kg|m(?:m)?)\s*(?:x?\s*([0-9]+)\s*(?:개|롤|입|병|캔|팩))?/i);
  
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

  // Fallback: g/ml 같은 용량 없이 단순히 "사과 10개", "수건 30롤" 만 있는 경우
  const countMatch = name.match(/([0-9]+)\s*(?:개|입|병|캔|팩|롤)/i);
  if (countMatch) {
    return { totalNum: parseInt(countMatch[1], 10), unit: '개' };
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
