export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const masterId = url.searchParams.get('master_id');

  try {
    const db = context.env.DB;
    // 1. Fetch Master Data
    const mastersData = await db.prepare("SELECT * FROM masters").all();
    
    // 2. Fetch Deals based on query or master_id
    let dealsData;
    if (masterId) {
       dealsData = await db.prepare("SELECT * FROM deals WHERE master_id = ?").bind(masterId).all();
    } else if (query) {
       dealsData = await db.prepare(
        "SELECT * FROM deals WHERE name LIKE ? OR mall_name LIKE ? OR master_id IN (SELECT master_id FROM masters WHERE product_name LIKE ? OR brand_name LIKE ?)"
      ).bind(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`).all();
    } else {
      dealsData = await db.prepare("SELECT * FROM deals").all();
    }
    
    // 3. Transform SQLite booleans (0/1) to true/false for the frontend
    const deals = dealsData.results.map(d => ({
      ...d,
      isWow: Boolean(d.isWow),
      isNaverFresh: Boolean(d.isNaverFresh),
      hasShinsegaeCoupon: Boolean(d.hasShinsegaeCoupon)
    }));
    
    return Response.json({
      masters: mastersData.results,
      deals: deals
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
