/**
 * UNI-MATE Matching Algorithm Simulation
 *
 * Generates 50 fake users with random locations, interests, major preferences,
 * vibe preferences, and purposes, then runs the scoring algorithm to verify
 * that distance weighting and filter logic produce expected distributions.
 *
 * Run with: npx ts-node --esm backend/src/utils/simulateMatching.ts
 * Or:       npx tsx backend/src/utils/simulateMatching.ts
 */

// --- Inline scoring functions (copied from matching.service.ts to run standalone) ---

function overlap(a: string[] = [], b: string[] = []) {
  return a.filter((x) => b.includes(x));
}

function haversineKm(coordsA: [number, number], coordsB: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lngA, latA] = coordsA;
  const [lngB, latB] = coordsB;
  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreUsers(me: any, candidate: any) {
  const interests = overlap(me.onboarding?.interests, candidate.onboarding?.interests);
  const styles = overlap(me.onboarding?.cafeStyles, candidate.onboarding?.cafeStyles);
  const goals = overlap(me.onboarding?.goals, candidate.onboarding?.goals);
  const times = overlap(me.onboarding?.preferredTimes, candidate.onboarding?.preferredTimes);
  let score = 0;

  // Distance (0-25)
  const hasLoc = (u: any) => u.location?.coordinates?.[0] && u.location?.coordinates?.[1];
  if (hasLoc(me) && hasLoc(candidate)) {
    const dist = haversineKm(me.location.coordinates, candidate.location.coordinates);
    score += Math.max(0, Math.round(25 * (1 - dist / 20)));
  } else {
    score += 5;
  }

  // Cafe style (0-20)
  score += Math.min(20, styles.length * 7);

  // Interest tags (0-15)
  score += Math.min(15, interests.length * 5);

  // Goal overlap (0-10)
  score += Math.min(10, goals.length * 5);

  // Major (0-10)
  const myMajorPref = me.onboarding?.majorPreference;
  const sameMajor = me.major && candidate.major && me.major === candidate.major;
  const diffMajor = me.major && candidate.major && me.major !== candidate.major;
  if (myMajorPref === "same" && sameMajor) score += 10;
  else if (myMajorPref === "different" && diffMajor) score += 10;
  else if (myMajorPref === "any" && (sameMajor || diffMajor)) score += 5;
  else if (!myMajorPref && sameMajor) score += 8;

  // Vibe (0-5)
  if (me.onboarding?.vibePreference && me.onboarding.vibePreference === candidate.onboarding?.vibePreference) {
    score += 5;
  }

  // Age (0-10)
  score += Math.max(0, 10 - Math.abs((me.age ?? 25) - (candidate.age ?? 25)) * 2);

  // Active recency (skip in simulation)

  // Time overlap (0-5)
  score += Math.min(5, times.length * 2);

  return { score: Math.min(100, Math.round(score)), interests, styles, goals };
}

// --- Generate fake users ---
const majors = ["Công nghệ thông tin", "Kinh tế - Kinh doanh", "Ngôn ngữ & Nhân văn", "Mỹ thuật & Thiết kế", "Khoa học sức khỏe", "Kỹ thuật & Công nghệ"];
const allInterests = ["#ThểThao", "#DuLịch", "#SựKiện", "#TìnhNguyện", "#Gym", "#ChơiGame", "#ĐọcSách", "#HọcThuật", "#Code", "#CôngNghệ", "#CàPhê", "#Mèo/Cún", "#XemPhim", "#ÂmNhạc", "#NhiếpẢnh", "#ẨmThực"];
const allCafeStyles = ["yên tĩnh", "acoustic", "view đẹp", "cafe mèo", "specialty coffee", "wifi mạnh", "có ổ cắm", "học bài", "làm việc", "sống ảo"];
const allGoals = ["Đi cafe trò chuyện", "Học nhóm", "Cùng ngành", "Khám phá quán mới", "Làm việc chung", "Tâm sự"];
const allTimes = ["sáng", "trưa", "chiều", "tối", "cuối tuần"];
const purposes = ["study_buddy", "cafe_chat", "boardgame_sport", "dating"];
const vibes = ["quiet_study", "acoustic_view", "boardgame_lively"];
const majorPrefs = ["same", "different", "any"];

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUser(id: number) {
  // Random location around HCM (lat ~10.7-10.9, lng ~106.6-106.8)
  const lat = 10.7 + Math.random() * 0.2;
  const lng = 106.6 + Math.random() * 0.2;
  return {
    _id: `user_${id}`,
    displayName: `User ${id}`,
    age: 18 + Math.floor(Math.random() * 10),
    major: pickOne(majors),
    location: { coordinates: [lng, lat] as [number, number] },
    onboarding: {
      interests: pick(allInterests, 3 + Math.floor(Math.random() * 4)),
      cafeStyles: pick(allCafeStyles, 3 + Math.floor(Math.random() * 3)),
      goals: pick(allGoals, 1 + Math.floor(Math.random() * 3)),
      preferredTimes: pick(allTimes, 2 + Math.floor(Math.random() * 2)),
      purpose: pickOne(purposes),
      vibePreference: pickOne(vibes),
      majorPreference: pickOne(majorPrefs)
    }
  };
}

// --- Run simulation ---
const NUM_USERS = 50;
const users = Array.from({ length: NUM_USERS }, (_, i) => generateUser(i));
const me = users[0];

console.log("=".repeat(70));
console.log("UNI-MATE Matching Algorithm Simulation");
console.log("=".repeat(70));
console.log(`\n👤 Test User: ${me.displayName} (${me.major})`);
console.log(`   Purpose: ${me.onboarding.purpose}`);
console.log(`   Vibe: ${me.onboarding.vibePreference}`);
console.log(`   Major Preference: ${me.onboarding.majorPreference}`);
console.log(`   Interests: ${me.onboarding.interests.join(", ")}`);
console.log(`   Location: [${me.location.coordinates[1].toFixed(4)}, ${me.location.coordinates[0].toFixed(4)}]`);
console.log();

// Filter by same purpose (hard filter)
const samePurpose = users.filter((u, i) => i > 0 && u.onboarding.purpose === me.onboarding.purpose);
console.log(`📋 Hard Filter: Same purpose "${me.onboarding.purpose}" → ${samePurpose.length}/${NUM_USERS - 1} candidates`);

// Score all candidates
const scored = samePurpose
  .map((candidate) => {
    const result = scoreUsers(me, candidate);
    const dist = haversineKm(me.location.coordinates, candidate.location.coordinates);
    return { ...candidate, ...result, distance: dist };
  })
  .sort((a, b) => b.score - a.score);

console.log("\n🏆 Top 10 Matches:");
console.log("-".repeat(70));
scored.slice(0, 10).forEach((c, i) => {
  console.log(
    `  ${i + 1}. ${c.displayName} | Score: ${c.score}% | Dist: ${c.distance.toFixed(1)}km | Major: ${c.major} | Vibe: ${c.onboarding.vibePreference}`
  );
  console.log(`     Shared interests: ${c.interests.length} | Shared styles: ${c.styles.length} | Shared goals: ${c.goals.length}`);
});

// Distribution analysis
console.log("\n📊 Score Distribution:");
const buckets: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
scored.forEach((c) => {
  if (c.score <= 20) buckets["0-20"]++;
  else if (c.score <= 40) buckets["21-40"]++;
  else if (c.score <= 60) buckets["41-60"]++;
  else if (c.score <= 80) buckets["61-80"]++;
  else buckets["81-100"]++;
});
Object.entries(buckets).forEach(([range, count]) => {
  const bar = "█".repeat(count);
  console.log(`  ${range.padEnd(8)} | ${bar} (${count})`);
});

// Distance vs Score verification
console.log("\n📍 Distance Weight Verification (should show closer = higher score for similar profiles):");
const byDist = [...scored].sort((a, b) => a.distance - b.distance);
console.log("  Closest 5:");
byDist.slice(0, 5).forEach((c) => console.log(`    ${c.displayName}: ${c.distance.toFixed(1)}km → Score: ${c.score}%`));
console.log("  Farthest 5:");
byDist.slice(-5).forEach((c) => console.log(`    ${c.displayName}: ${c.distance.toFixed(1)}km → Score: ${c.score}%`));

const avgCloseScore = byDist.slice(0, 5).reduce((s, c) => s + c.score, 0) / Math.min(5, byDist.length);
const avgFarScore = byDist.slice(-5).reduce((s, c) => s + c.score, 0) / Math.min(5, byDist.length);
console.log(`\n  Avg score (closest 5): ${avgCloseScore.toFixed(1)}%`);
console.log(`  Avg score (farthest 5): ${avgFarScore.toFixed(1)}%`);
console.log(`  ✅ Distance weighting ${avgCloseScore > avgFarScore ? "CONFIRMED" : "needs tuning"}: closer users tend to score higher`);

console.log("\n" + "=".repeat(70));
console.log("Simulation complete.");
