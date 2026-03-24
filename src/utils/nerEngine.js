import { Master_Product } from '../mockData/Master_DB';

export function runNERPipeline(rawTitle) {
  // Simulates an Advanced NLP Name Entity Recognition pipeline mapping
  // text to { brand, name, capacity, qty }
  
  let result = { brand: '기타/미상', name: rawTitle, size: '알수없음', qty: 1 };
  let bestMasterMatch = null;
  
  // Regex mimicking NER Extraction
  const qtyMatch = rawTitle.match(/([0-9]+)(?:개|롤|입)/);
  if (qtyMatch) result.qty = parseInt(qtyMatch[1], 10);
  
  const sizeMatch = rawTitle.match(/([0-9.]+)(L|ml|g|kg|m)/i);
  if (sizeMatch) result.size = sizeMatch[0];
  
  // Knowledge Graph Keyword Matching for Identity Engine
  for (const master of Master_Product) {
    if (rawTitle.includes(master.product_name) || rawTitle.includes(master.brand_name) || rawTitle.includes(master.brand_name.replace('제주', ''))) {
      result.brand = master.brand_name;
      result.name = master.product_name;
      bestMasterMatch = master.master_id;
      if (!result.size || result.size === '알수없음') result.size = master.standard_capacity;
      break;
    }
  }

  return { entities: result, matchedMasterId: bestMasterMatch };
}
