const js = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();

const keys = [
  "ProjectDetail",
  "projectDetail",
  "ProjectsPage",
  "DataEntryDetail",
  "EntryDetail",
  "data-entries",
  "dataEntries",
  "DataForm",
  "collectionName",
  "ObjektDetail",
  "eintrag",
  "detail/",
  "DetailPage",
  "entityId",
  "DatabaseId",
  "OBJ-",
  "routePath",
  "appRoutes",
  "ROUTES",
];

for (const key of keys) {
  let from = 0;
  let n = 0;
  while (n < 3) {
    const i = js.indexOf(key, from);
    if (i < 0) break;
    console.log("\n", key, "@", i);
    console.log(js.slice(Math.max(0, i - 60), i + 120).replace(/\n/g, " "));
    from = i + key.length;
    n++;
  }
}

// Look for URL builders with encodeURIComponent around ids
const re = /encodeURIComponent\([^)]{0,40}\)/g;
const enc = [...js.matchAll(re)].map((m) => m[0]);
console.log("\nencodeURIComponent samples:", [...new Set(enc)].slice(0, 30));

// Look for template literals with slash and id
const re2 = /`\/[^`]{1,60}`/g;
const tpls = [...js.matchAll(re2)].map((m) => m[0]);
const interesting = [...new Set(tpls)].filter((s) =>
  /id|project|entry|form|detail|data/i.test(s)
);
console.log("\ntemplate paths:", interesting.slice(0, 80));
