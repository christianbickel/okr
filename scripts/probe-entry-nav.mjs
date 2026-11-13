const main = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();

const detail = await (
  await fetch("https://staging.consi.cloud/assets/DataEntryDetail-BE6GvYBh.js")
).text();

const entryPage = await (
  await fetch("https://staging.consi.cloud/assets/EntryDetailPage-FGNBFYLd.js")
).text();

console.log("=== EntryDetailPage full ===");
console.log(entryPage);

console.log("\n=== navigate to /entry ===");
for (const js of [main, detail]) {
  let from = 0;
  let n = 0;
  while (n < 20) {
    const i = js.indexOf("/entry/", from);
    if (i < 0) break;
    console.log(js.slice(Math.max(0, i - 80), i + 100).replace(/\n/g, " "));
    from = i + 7;
    n++;
  }
}

console.log("\n=== `/entry/${ ===");
for (const js of [main, detail]) {
  let from = 0;
  let n = 0;
  while (n < 20) {
    const i = js.indexOf("`/entry/${", from);
    if (i < 0) break;
    console.log(js.slice(Math.max(0, i - 40), i + 80).replace(/\n/g, " "));
    from = i + 10;
    n++;
  }
}

console.log("\n=== encodeURIComponent around entry ===");
let from = 0;
let n = 0;
while (n < 10) {
  const i = main.indexOf("encodeURIComponent", from);
  if (i < 0) break;
  const snip = main.slice(Math.max(0, i - 100), i + 80);
  if (/entry|id|navigate/i.test(snip)) {
    console.log(snip.replace(/\n/g, " "));
  }
  from = i + 18;
  n++;
}

// Look for Link to entry
from = 0;
n = 0;
console.log("\n=== to:`/entry ===");
while (n < 15) {
  const i = detail.indexOf("to:`/entry", from);
  if (i < 0) {
    const i2 = detail.indexOf('to:"/entry', from);
    if (i2 < 0) break;
    console.log(detail.slice(Math.max(0, i2 - 40), i2 + 80).replace(/\n/g, " "));
    from = i2 + 10;
  } else {
    console.log(detail.slice(Math.max(0, i - 40), i + 80).replace(/\n/g, " "));
    from = i + 10;
  }
  n++;
}
