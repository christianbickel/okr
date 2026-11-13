const names = [
  "main-DTQ_t-K4.js",
  "DataEntryDetail-BE6GvYBh.js",
  "CreateNewItemButton-CKwpVHKD.js",
  "chunk-6KYCQHYJ-BXmKyEY_.js",
];

// Discover more asset names from main preload map
const main = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();
const assetNames = [
  ...new Set(
    [...main.matchAll(/assets\/([A-Za-z0-9_-]+\.js)/g)].map((m) => m[1])
  ),
];
console.log("assets count", assetNames.length);

const interesting = [];
for (const name of assetNames) {
  const js = await (
    await fetch(`https://staging.consi.cloud/assets/${name}`)
  ).text();
  if (js.includes("`/entry/") || js.includes('"/entry/') || js.includes("'/entry/")) {
    interesting.push(name);
    let from = 0;
    let n = 0;
    console.log("\n====", name);
    while (n < 8) {
      let i = js.indexOf("`/entry/", from);
      if (i < 0) i = js.indexOf('"/entry/', from);
      if (i < 0) i = js.indexOf("'/entry/", from);
      if (i < 0) break;
      console.log(js.slice(Math.max(0, i - 100), i + 120).replace(/\n/g, " "));
      from = i + 8;
      n++;
    }
  }
}
console.log("\ninteresting assets", interesting);
