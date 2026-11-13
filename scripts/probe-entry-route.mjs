const assets = [
  "EntryDetailPage-FGNBFYLd.js",
  "DataEntryDetail-BE6GvYBh.js",
  "EditorRoutes-D98LxVhO.js",
];

for (const name of assets) {
  const js = await (
    await fetch(`https://staging.consi.cloud/assets/${name}`)
  ).text();
  console.log("\n====", name, "len", js.length);

  const tpls = [...js.matchAll(/`\/[^`]{1,80}`/g)].map((m) => m[0]);
  const paths = [...js.matchAll(/path:"[^"]+"/g)].map((m) => m[0]);
  const paths2 = [...js.matchAll(/path:'[^']+'/g)].map((m) => m[0]);
  console.log("templates", [...new Set(tpls)].slice(0, 40));
  console.log("paths", [...new Set([...paths, ...paths2])].slice(0, 40));

  for (const key of [
    "/entry/",
    "entry/",
    "useParams",
    "databaseId",
    "params.id",
    "navigate(",
    "to:`",
    'to:"',
  ]) {
    let from = 0;
    let n = 0;
    while (n < 4) {
      const i = js.indexOf(key, from);
      if (i < 0) break;
      console.log(key, "@", i, "=>", js.slice(Math.max(0, i - 50), i + 100).replace(/\n/g, " "));
      from = i + key.length;
      n++;
    }
  }
}

// Also search main for /entry/
const main = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();
let from = 0;
let n = 0;
console.log("\n==== main /entry");
while (n < 15) {
  const i = main.indexOf("/entry", from);
  if (i < 0) break;
  console.log("@", i, main.slice(Math.max(0, i - 40), i + 80).replace(/\n/g, " "));
  from = i + 6;
  n++;
}
