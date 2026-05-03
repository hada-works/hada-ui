import type { GbpLocation, GbpReviewItem, GbpFullProfile } from "@/types"

// ─── Health tier thresholds ───────────────────────────────────────────────────
export const HEALTH_CRITICAL_MAX = 30   // < 30  → critical
export const HEALTH_WARNING_MAX  = 60   // 30–59 → warning
                                        // ≥ 60  → healthy

export const BRAND_CANONICAL_NAME = "Hada Market"

// ─── Next-Best-Action definitions (static content) ───────────────────────────
export const NBA_ACTIONS = [
  {
    id:       "nba-name",
    priority: 1,
    label:    "Priority 1 — Immediate",
    title:    "Fix Brand Name Inconsistencies",
    body:     "Several listings use variants like \"Hada\", \"Hada Mart\" or \"Hada Supermarket\". Google treats each variant as a separate entity, destroying local-pack ranking and brand authority.",
    actions:  [
      "Standardise all GBP names to: Hada Market",
      "Enable GBP profile lock to prevent 3rd-party edits",
      "Submit bulk edits via Google Business Manager",
      "Verify name propagation across every listing",
    ],
    filterKey: "nameIssues" as const,
  },
  {
    id:       "nba-web",
    priority: 1,
    label:    "Priority 1 — Immediate",
    title:    "Add Missing Websites & Phones",
    body:     "5 locations have no website URL and 2 have no phone number. These are top-3 GBP ranking signals — their absence causes customers to choose competitors shown above in Maps results.",
    actions:  [
      "Add website URL (or city landing page) to the 5 missing listings",
      "Add verified phone numbers (+84) to the 2 missing listings",
      "Confirm all URLs are mobile-responsive",
      "Set UTM parameters for traffic attribution per city",
    ],
    filterKey: "missingWeb" as const,
  },
  {
    id:       "nba-reviews",
    priority: 2,
    label:    "Priority 2 — This Week",
    title:    "Respond to Unanswered Reviews",
    body:     "Average response rate is 38% — well below the 80%+ target. Google rewards consistent response behaviour with higher local-pack visibility.",
    actions:  [
      "Reply to all unanswered 1-star & 2-star reviews within 24 h",
      "Set up a review-response template for common themes",
      "Schedule weekly review-monitoring across all listings",
    ],
    filterKey: "lowResponse" as const,
  },
  {
    id:       "nba-content",
    priority: 2,
    label:    "Priority 2 — This Week",
    title:    "Add Photos & Descriptions",
    body:     "7 locations have no business description and 6 have fewer than 5 photos. Rich media directly increases click-through-rate from Maps by up to 35%.",
    actions:  [
      "Write a 150-word description for each of the 7 missing listings",
      "Upload ≥ 10 photos per location (interior, exterior, products)",
      "Add Google Posts to boost freshness signals",
    ],
    filterKey: "missingContent" as const,
  },
] as const

// ─── Mock GBP locations ───────────────────────────────────────────────────────

function mk(
  id: string, name: string, correct: boolean,
  city: string, address: string, score: number,
  f: { w: boolean; ph: boolean; cat: boolean; hrs: boolean; pics: number; desc: boolean },
  r: { cnt: number; rat: number; rr: number; d: [number,number,number,number,number]; pos: number; neu: number; neg: number },
): GbpLocation {
  return {
    id, name, tenantId: "t1", nameIsCorrect: correct, city, address,
    healthScore: score,
    status: score < HEALTH_CRITICAL_MAX ? "critical" : score < HEALTH_WARNING_MAX ? "warning" : "healthy",
    fields:  { hasWebsite: f.w, hasPhone: f.ph, hasCategory: f.cat, hasHours: f.hrs, photoCount: f.pics, hasDescription: f.desc },
    review:  { totalCount: r.cnt, avgRating: r.rat, responseRate: r.rr, dist: r.d, positivePct: r.pos, neutralPct: r.neu, negativePct: r.neg },
    lastAudit: "2025-05-01",
  }
}

// ─── Full GBP profiles (representative healthy locations) ─────────────────────

const HOURS_STANDARD: GbpFullProfile["regularHours"] = {
  monday: "07:00–22:00", tuesday: "07:00–22:00", wednesday: "07:00–22:00",
  thursday: "07:00–22:00", friday: "07:00–22:30", saturday: "07:00–22:30", sunday: "08:00–22:00",
}

const PROFILE_G11: GbpFullProfile = {
  primaryCategory: "Supermarket",
  secondaryCategories: ["Grocery Store", "Fresh Produce Market", "Organic Food Store"],
  phone: "+84 28 3822 1111", additionalPhone: "+84 909 111 222",
  website: "https://hadamarket.vn/quan3",
  mapsUrl: "https://maps.google.com/?cid=example-g11",
  openingDate: "2019-03",
  shortDescription: "Hada Market Phạm Ngọc Thạch là siêu thị thực phẩm sạch hàng đầu khu vực Quận 3, chuyên cung cấp thực phẩm tươi sống nhập khẩu, rau củ hữu cơ và hàng tiêu dùng cao cấp. Diện tích 1.200m², hơn 15.000 SKU, hàng mới nhập mỗi ngày.",
  regularHours: HOURS_STANDARD,
  hasSpecialHours: true,
  attributes: { wheelchair: true, parking: true, wifi: true, cashPayment: true, cardPayment: true, delivery: true, dineIn: false, takeout: true },
  postCount: 8, qaCount: 24,
  hasBookingLink: false, hasMenuLink: false, hasProductCatalog: true,
  logoUploaded: true, coverPhotoUploaded: true,
}

const PROFILE_G12: GbpFullProfile = {
  primaryCategory: "Supermarket",
  secondaryCategories: ["Grocery Store", "Health Food Store"],
  phone: "+84 24 3756 2222",
  website: "https://hadamarket.vn/caugiay",
  mapsUrl: "https://maps.google.com/?cid=example-g12",
  openingDate: "2020-06",
  shortDescription: "Hada Market Xuân Thủy phục vụ cộng đồng dân cư và sinh viên khu vực Cầu Giấy – Cầu Diễn với hơn 12.000 sản phẩm đa dạng, bao gồm thực phẩm tươi, đông lạnh, hàng nhập khẩu và sản phẩm địa phương chất lượng cao.",
  regularHours: { ...HOURS_STANDARD, sunday: "07:30–22:00" },
  hasSpecialHours: true,
  attributes: { wheelchair: true, parking: true, wifi: false, cashPayment: true, cardPayment: true, delivery: true, dineIn: false, takeout: true },
  postCount: 5, qaCount: 18,
  hasBookingLink: false, hasMenuLink: false, hasProductCatalog: true,
  logoUploaded: true, coverPhotoUploaded: true,
}

const PROFILE_G15: GbpFullProfile = {
  primaryCategory: "Supermarket",
  secondaryCategories: ["Grocery Store", "Organic Food Store", "Wine Shop", "Deli"],
  phone: "+84 28 3823 5555", additionalPhone: "+84 908 555 666",
  website: "https://hadamarket.vn/nguyendu",
  mapsUrl: "https://maps.google.com/?cid=example-g15",
  openingDate: "2017-09",
  shortDescription: "Hada Market Nguyễn Du – flagship store tại trung tâm Quận 1 với hơn 18.000 SKU, chuyên thực phẩm nhập khẩu cao cấp, rượu vang, phô mai và thực phẩm hữu cơ. Dịch vụ giao hàng trong 2h, đặt trước qua app.",
  regularHours: { monday: "07:00–23:00", tuesday: "07:00–23:00", wednesday: "07:00–23:00", thursday: "07:00–23:00", friday: "07:00–23:30", saturday: "07:00–23:30", sunday: "08:00–23:00" },
  hasSpecialHours: true,
  attributes: { wheelchair: true, parking: false, wifi: true, cashPayment: true, cardPayment: true, delivery: true, dineIn: false, takeout: true },
  postCount: 14, qaCount: 38,
  hasBookingLink: true, hasMenuLink: false, hasProductCatalog: true,
  logoUploaded: true, coverPhotoUploaded: true,
}

export const GBP_LOCATIONS: GbpLocation[] = [
  // ── Critical (<30%) ──────────────────────────────────────────────────────────
  mk("g01", "Hada Market VN",     false, "Hồ Chí Minh", "123 Nguyễn Huệ, Q.1",            18,
    { w: false, ph: false, cat: true,  hrs: false, pics: 1,  desc: false },
    { cnt:  45, rat: 3.8, rr: 10, d: [3,2,8,18,14],       pos: 55, neu: 25, neg: 20 }),
  mk("g02", "Hada Mart",          false, "Hà Nội",      "56 Tây Sơn, Đống Đa",             22,
    { w: false, ph: true,  cat: false, hrs: false, pics: 2,  desc: false },
    { cnt:  89, rat: 4.0, rr: 15, d: [2,3,12,40,32],      pos: 62, neu: 22, neg: 16 }),
  mk("g03", "Hada",               false, "Đà Nẵng",     "88 Lê Duẩn, Hải Châu",            25,
    { w: false, ph: true,  cat: true,  hrs: true,  pics: 3,  desc: false },
    { cnt:  31, rat: 4.2, rr:  8, d: [1,1,4,12,13],       pos: 70, neu: 20, neg: 10 }),
  mk("g04", "Hada Supermarket",   false, "Hồ Chí Minh", "200 CMT8, Q.3",                   28,
    { w: true,  ph: false, cat: true,  hrs: false, pics: 2,  desc: false },
    { cnt: 112, rat: 3.6, rr:  5, d: [10,8,22,42,30],     pos: 48, neu: 28, neg: 24 }),

  // ── Warning (30–59%) ─────────────────────────────────────────────────────────
  mk("g05", "Hada Market",        true,  "Hồ Chí Minh", "1 Vincom Landmark 81, Bình Thạnh", 38,
    { w: true,  ph: true,  cat: true,  hrs: false, pics: 4,  desc: false },
    { cnt: 234, rat: 4.3, rr: 28, d: [3,4,20,95,112],     pos: 72, neu: 18, neg: 10 }),
  mk("g06", "Hada Market",        true,  "Hà Nội",      "72 Hoàn Kiếm, Hoàn Kiếm",         42,
    { w: false, ph: true,  cat: true,  hrs: true,  pics: 6,  desc: false },
    { cnt: 178, rat: 4.1, rr: 22, d: [5,6,18,74,75],      pos: 65, neu: 24, neg: 11 }),
  mk("g07", "Hada Market",        true,  "Hồ Chí Minh", "340 Điện Biên Phủ, Bình Thạnh",   45,
    { w: true,  ph: true,  cat: true,  hrs: false, pics: 5,  desc: true  },
    { cnt: 156, rat: 4.0, rr: 35, d: [4,5,24,62,61],      pos: 60, neu: 25, neg: 15 }),
  mk("g08", "Hada Market",        true,  "Nha Trang",   "10 Trần Phú, Nha Trang",           50,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 7,  desc: true  },
    { cnt:  88, rat: 4.4, rr: 40, d: [1,2,8,32,45],       pos: 75, neu: 18, neg:  7 }),
  mk("g09", "Hada Mart - CT",     false, "Cần Thơ",     "55 Hùng Vương, Ninh Kiều",         35,
    { w: false, ph: true,  cat: true,  hrs: true,  pics: 3,  desc: false },
    { cnt:  67, rat: 3.9, rr: 18, d: [3,3,12,27,22],      pos: 58, neu: 28, neg: 14 }),
  mk("g10", "Hada Market",        true,  "Hải Phòng",   "120 Lạch Tray, Ngô Quyền",         55,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 8,  desc: true  },
    { cnt: 145, rat: 4.2, rr: 45, d: [2,3,18,58,64],      pos: 68, neu: 22, neg: 10 }),

  // ── Healthy (60%+) ───────────────────────────────────────────────────────────
  { ...mk("g11", "Hada Market",        true,  "Hồ Chí Minh", "1 Phạm Ngọc Thạch, Q.3",          78,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 22, desc: true  },
    { cnt: 312, rat: 4.5, rr: 72, d: [3,4,18,100,187],    pos: 82, neu: 12, neg:  6 }), profile: PROFILE_G11 },
  { ...mk("g12", "Hada Market",        true,  "Hà Nội",      "90 Xuân Thủy, Cầu Giấy",           82,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 18, desc: true  },
    { cnt: 267, rat: 4.6, rr: 78, d: [2,2,15,88,160],     pos: 85, neu: 11, neg:  4 }), profile: PROFILE_G12 },
  mk("g13", "Hada Market",        true,  "Đà Nẵng",     "250 Trường Sa, Ngũ Hành Sơn",      65,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 11, desc: true  },
    { cnt: 124, rat: 4.4, rr: 55, d: [2,3,12,48,59],      pos: 76, neu: 16, neg:  8 }),
  mk("g14", "Hada Market",        true,  "Vũng Tàu",    "33 Lê Lợi, Vũng Tàu",              70,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 14, desc: true  },
    { cnt:  98, rat: 4.3, rr: 60, d: [1,2,10,38,47],      pos: 78, neu: 15, neg:  7 }),
  { ...mk("g15", "Hada Market",        true,  "Hồ Chí Minh", "55 Nguyễn Du, Q.1",                88,
    { w: true,  ph: true,  cat: true,  hrs: true,  pics: 28, desc: true  },
    { cnt: 389, rat: 4.7, rr: 85, d: [2,3,15,115,254],    pos: 88, neu:  9, neg:  3 }), profile: PROFILE_G15 },
]

// ─── Mock individual reviews ──────────────────────────────────────────────────

export const GBP_REVIEWS: GbpReviewItem[] = [
  // g01 — critical, low response
  { id: "r01", tenantId: "t1", locationId: "g01", reviewerName: "Nguyễn Văn An",    rating: 1, date: "2025-04-28", sentiment: "negative",
    text: "Cửa hàng không có website, gọi điện không ai nghe. Rất khó liên lạc.", responded: false },
  { id: "r02", tenantId: "t1", locationId: "g01", reviewerName: "Trần Thị Bình",    rating: 2, date: "2025-04-15", sentiment: "negative",
    text: "Đặt hàng online không được vì không thấy link web. Thất vọng.", responded: false },
  { id: "r03", tenantId: "t1", locationId: "g01", reviewerName: "Lê Minh Cường",    rating: 4, date: "2025-03-30", sentiment: "positive",
    text: "Hàng hóa đa dạng, nhân viên vui vẻ. Chỉ tiếc là không có số điện thoại để đặt trước.", responded: false },

  // g02 — critical
  { id: "r04", tenantId: "t1", locationId: "g02", reviewerName: "Phạm Thu Hà",      rating: 1, date: "2025-04-22", sentiment: "negative",
    text: "Tên cửa hàng trên Google khác với biển hiệu thực tế, rất lộn xộn.", responded: false },
  { id: "r05", tenantId: "t1", locationId: "g02", reviewerName: "Hoàng Đức Dũng",   rating: 3, date: "2025-04-10", sentiment: "neutral",
    text: "Siêu thị bình thường, chưa có gì đặc biệt so với các nơi khác.", responded: false },

  // g04 — critical, worst score
  { id: "r06", tenantId: "t1", locationId: "g04", reviewerName: "Vũ Thị Lan",       rating: 1, date: "2025-05-01", sentiment: "negative",
    text: "Thông tin giờ mở cửa trên Google sai hoàn toàn. Tôi đến lúc 8h tối nhưng cửa hàng đã đóng lúc 7h.", responded: false },
  { id: "r07", tenantId: "t1", locationId: "g04", reviewerName: "Đặng Quốc Bảo",    rating: 2, date: "2025-04-27", sentiment: "negative",
    text: "Không có số điện thoại để liên lạc hỏi về sản phẩm. Rất bất tiện.", responded: false },
  { id: "r08", tenantId: "t1", locationId: "g04", reviewerName: "Bùi Thị Hương",    rating: 5, date: "2025-04-05", sentiment: "positive",
    text: "Sản phẩm tươi ngon, giá hợp lý. Sẽ quay lại thường xuyên.",
    responded: true, response: "Cảm ơn bạn đã ủng hộ Hada Market! Hẹn gặp lại bạn sớm nhé.", responseDate: "2025-04-06" },

  // g05 — warning, improving
  { id: "r09", tenantId: "t1", locationId: "g05", reviewerName: "Ngô Thị Mai",      rating: 4, date: "2025-04-29", sentiment: "positive",
    text: "Siêu thị rộng, hàng hóa phong phú. Tuy nhiên chưa thấy có mô tả chi tiết về cửa hàng.",
    responded: true, response: "Chào bạn! Cảm ơn phản hồi. Chúng tôi sẽ cập nhật thông tin đầy đủ hơn.", responseDate: "2025-04-30" },
  { id: "r10", tenantId: "t1", locationId: "g05", reviewerName: "Trịnh Văn Khánh",  rating: 5, date: "2025-04-20", sentiment: "positive",
    text: "Vị trí đẹp tại Landmark 81, nhân viên chuyên nghiệp, hàng nhập khẩu nhiều.",
    responded: true, response: "Rất vui khi bạn hài lòng! Chúng tôi luôn cố gắng mang đến trải nghiệm tốt nhất.", responseDate: "2025-04-21" },
  { id: "r11", tenantId: "t1", locationId: "g05", reviewerName: "Lý Thị Nhung",     rating: 2, date: "2025-04-12", sentiment: "negative",
    text: "Hàng hóa bổ sung giờ mở cửa đi, 8h tối đóng cửa sớm quá.", responded: false },

  // g06 — warning, no website
  { id: "r12", tenantId: "t1", locationId: "g06", reviewerName: "Đinh Công Sơn",    rating: 4, date: "2025-04-25", sentiment: "positive",
    text: "Gần Hồ Hoàn Kiếm, mua sắm tiện lợi. Mong sớm có website để đặt hàng online.",
    responded: false },
  { id: "r13", tenantId: "t1", locationId: "g06", reviewerName: "Cao Thị Thanh",    rating: 3, date: "2025-04-08", sentiment: "neutral",
    text: "Chất lượng ổn nhưng giá cao hơn chợ truyền thống một chút.",
    responded: true, response: "Hada Market cam kết hàng hóa đạt chuẩn an toàn thực phẩm, cảm ơn bạn đã phản hồi!", responseDate: "2025-04-09" },

  // g08 — warning but good reviews
  { id: "r14", tenantId: "t1", locationId: "g08", reviewerName: "Phan Văn Tài",     rating: 5, date: "2025-04-30", sentiment: "positive",
    text: "View biển tuyệt vời, sản phẩm tươi sống phong phú. Nhân viên nhiệt tình.",
    responded: true, response: "Cảm ơn bạn! Hada Market Nha Trang luôn mang đến không gian mua sắm thú vị nhất.", responseDate: "2025-04-30" },
  { id: "r15", tenantId: "t1", locationId: "g08", reviewerName: "Lưu Thị Kim Anh",  rating: 4, date: "2025-04-18", sentiment: "positive",
    text: "Rau củ tươi, bày trí gọn gàng. Có chỗ để xe rộng.",
    responded: true, response: "Chúng tôi rất vui được phục vụ bạn tại Nha Trang!", responseDate: "2025-04-19" },

  // g11 — healthy, high performer
  { id: "r16", tenantId: "t1", locationId: "g11", reviewerName: "Nguyễn Thị Duyên", rating: 5, date: "2025-05-01", sentiment: "positive",
    text: "Siêu thị sạch đẹp, hàng hóa đa dạng. Ứng dụng đặt hàng online rất tiện.",
    responded: true, response: "Cảm ơn bạn rất nhiều! Đây là động lực để chúng tôi tiếp tục phát triển.", responseDate: "2025-05-01" },
  { id: "r17", tenantId: "t1", locationId: "g11", reviewerName: "Trần Minh Hiếu",   rating: 4, date: "2025-04-26", sentiment: "positive",
    text: "Hàng hóa tươi ngon. Giờ mở cửa linh hoạt. Sẽ giới thiệu cho bạn bè.",
    responded: true, response: "Chào bạn! Hada Market Q.3 luôn cố gắng phục vụ tốt nhất. Cảm ơn bạn đã ủng hộ!", responseDate: "2025-04-26" },
  { id: "r18", tenantId: "t1", locationId: "g11", reviewerName: "Lê Khánh Linh",    rating: 5, date: "2025-04-14", sentiment: "positive",
    text: "Đây là siêu thị yêu thích của gia đình tôi. Chất lượng ổn định, nhân viên thân thiện.",
    responded: true, response: "Cảm ơn gia đình bạn đã tin tưởng chúng tôi! Hẹn gặp lại!", responseDate: "2025-04-14" },

  // g12 — healthy, best in HN
  { id: "r19", tenantId: "t1", locationId: "g12", reviewerName: "Vũ Anh Tuấn",      rating: 5, date: "2025-04-28", sentiment: "positive",
    text: "Siêu thị hiện đại nhất khu vực Cầu Giấy. Hàng nhập khẩu phong phú, giá tốt.",
    responded: true, response: "Chúng tôi rất vui khi được là lựa chọn của bạn! Cảm ơn và hẹn gặp lại.", responseDate: "2025-04-28" },
  { id: "r20", tenantId: "t1", locationId: "g12", reviewerName: "Hoàng Minh Châu",  rating: 2, date: "2025-04-16", sentiment: "negative",
    text: "Hôm qua hàng hóa ở khu rau củ trống nhiều, nhân viên không bổ sung kịp.",
    responded: true, response: "Xin lỗi vì sự bất tiện! Chúng tôi đã phản ánh với đội vận hành và sẽ cải thiện ngay.", responseDate: "2025-04-16" },

  // g13 — healthy, Đà Nẵng
  { id: "r21", tenantId: "t1", locationId: "g13", reviewerName: "Phạm Thị Quỳnh",   rating: 5, date: "2025-04-23", sentiment: "positive",
    text: "Siêu thị sạch, không gian thoáng. Gần biển Mỹ Khê rất tiện.",
    responded: true, response: "Cảm ơn bạn! Hada Market Đà Nẵng rất vui được phục vụ.", responseDate: "2025-04-24" },
  { id: "r22", tenantId: "t1", locationId: "g13", reviewerName: "Bùi Quang Hải",    rating: 3, date: "2025-04-09", sentiment: "neutral",
    text: "Hàng hóa ổn nhưng bãi đậu xe hơi nhỏ, giờ cao điểm rất khó đỗ.",
    responded: false },

  // g15 — best performer
  { id: "r23", tenantId: "t1", locationId: "g15", reviewerName: "Nguyễn Bích Ngọc", rating: 5, date: "2025-05-02", sentiment: "positive",
    text: "Hada Market Nguyễn Du là địa chỉ mua sắm tin cậy. Hàng tươi mỗi ngày, nhân viên lịch sự.",
    responded: true, response: "Cảm ơn bạn đã yêu quý chúng tôi! Hẹn gặp lại bạn sớm nhé.", responseDate: "2025-05-02" },
  { id: "r24", tenantId: "t1", locationId: "g15", reviewerName: "Trần Văn Đông",    rating: 5, date: "2025-04-24", sentiment: "positive",
    text: "Mua sắm online giao nhanh, hàng đúng mô tả. Rất hài lòng!",
    responded: true, response: "Chúng tôi rất vui khi giao hàng đúng hẹn! Cảm ơn bạn đã tin tưởng Hada Market.", responseDate: "2025-04-24" },
  { id: "r25", tenantId: "t1", locationId: "g15", reviewerName: "Lê Thị Mộng Tuyền", rating: 1, date: "2025-04-03", sentiment: "negative",
    text: "Nhân viên thu ngân thái độ kém, không xin lỗi khi tính sai tiền.",
    responded: true, response: "Chúng tôi thành thật xin lỗi về trải nghiệm không tốt này. Đã phản ánh tới quản lý cửa hàng và sẽ cải thiện ngay.", responseDate: "2025-04-03" },
]
