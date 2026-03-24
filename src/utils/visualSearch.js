import { Master_Product } from '../mockData/Master_DB';

export function scanBarcode(barcodeStr) {
  // Barcode is an absolute 1:1 identifier matching Master DB
  return Master_Product.find(p => p.barcode_number === barcodeStr) || null;
}

export function searchByImage(imageMockKeyword) {
  // Multi-modal Vision API simulation (e.g. GPT-5 Vision or Gemini analyzing an image)
  const keyword = imageMockKeyword.toLowerCase();
  
  if (keyword.includes('water') || keyword.includes('bottle') || keyword.includes('생수')) {
    return Master_Product.find(p => p.master_id === 'M1001'); // Returns Samdasoo
  }
  if (keyword.includes('rice') || keyword.includes('햇반') || keyword.includes('밥')) {
    return Master_Product.find(p => p.master_id === 'M1002');
  }
  if (keyword.includes('tissue') || keyword.includes('휴지') || keyword.includes('화장지')) {
    return Master_Product.find(p => p.master_id === 'M1003');
  }
  
  return null;
}
