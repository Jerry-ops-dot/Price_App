const titles = [
  "제주 삼다수 2L 6개",
  "제주 삼다수 2L x 6",
  "동원샘물 500ml 20병",
  "에비앙 생수 330ml x 24",
  "지리산 맑은샘물 2.0L 12입",
  "스파클 2L 24개",
  "탐사수 2L 6펫",
  "농심 백산수 2L 6개입",
  "백산수 2Lx6"
];

const re1 = /([0-9.]+)\s*(L|ml|g|kg|m(?:m)?)\s*(?:x?\s*([0-9]+)\s*(?:개|롤|입|병|캔|팩|묶음|포|구|박스))?/i;

// Improved regex: Make the Korean suffix optional if 'x' is present.
const re2 = /([0-9.]+)\s*(L|ml|g|kg|m(?:m)?)\s*(?:(?:x|X|\*)\s*([0-9]+)\s*(?:개|롤|입|병|캔|팩|묶음|포|구|박스|페트|펫)?|\s+([0-9]+)\s*(?:개|롤|입|병|캔|팩|묶음|포|구|박스|페트|펫))/i;

for (const t of titles) {
  const m1 = t.match(re1);
  const m2 = t.match(re2);
  
  const c1 = m1 ? (m1[3] || 1) : null;
  
  const m2_count = m2 ? (m2[3] || m2[4] || 1) : null;
  console.log(`Title: ${t}`);
  console.log(`  Old Regex Count: ${c1}`);
  console.log(`  New Regex Count: ${m2_count}`);
}
