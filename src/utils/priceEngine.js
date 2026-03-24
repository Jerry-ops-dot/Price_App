export function parseUnit(name) {
  let totalNum = null;
  let unit = null;

  const match = name.match(/([0-9.]+)(L|ml|g|kg|m)\s*(?:x\s*([0-9]+)(?:개|롤))?/i);
  if (match) {
    let amount = parseFloat(match[1]);
    const rawUnit = match[2].toLowerCase();
    const count = match[3] ? parseInt(match[3]) : 1;

    if (rawUnit === 'l') { amount *= 1000; unit = 'ml'; }
    else if (rawUnit === 'kg') { amount *= 1000; unit = 'g'; }
    else { unit = rawUnit; }

    totalNum = amount * count;
  }
  return { totalNum, unit };
}

export function calculateStandardPrice(price, totalNum, unit, categoryStandardUnitStr) {
  if (!totalNum || !categoryStandardUnitStr) return null;
  const standardMatch = categoryStandardUnitStr.match(/([0-9]+)([a-z]+)/);
  if (!standardMatch) return null;
  
  const standardAmount = parseInt(standardMatch[1]);
  const perUnit = price / totalNum;
  
  return Math.round(perUnit * standardAmount);
}
