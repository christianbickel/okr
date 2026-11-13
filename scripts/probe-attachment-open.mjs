const js = await (
  await fetch("https://staging.consi.cloud/assets/PileColorDot-D_REGSMC.js")
).text();

console.log("len", js.length);

// Around thumbnail helper
const i = js.indexOf("thumbnail=true");
console.log("thumb context", js.slice(i - 200, i + 200));

// Around previewType switch
const j = js.indexOf("cE.includes(e.previewType)");
console.log("\npreview switch", js.slice(j - 100, j + 800));

// Search attachment open / navigate patterns
for (const key of [
  "`/entry/${",
  "encodeURIComponent(e",
  "openAttachment",
  "AttachmentPreview",
  "previewAttachment",
  "editorApp",
  "window.open",
  "downloadUrl",
  "onOpenAttachment",
  "AttachmentModal",
  "FilePreview",
]) {
  let from = 0;
  let n = 0;
  console.log("\n====", key);
  while (n < 5) {
    const idx = js.indexOf(key, from);
    if (idx < 0) break;
    console.log("@", idx, js.slice(Math.max(0, idx - 70), idx + 110).replace(/\n/g, " "));
    from = idx + key.length;
    n++;
  }
}

// Look for route with attachment
const main = await (
  await fetch("https://staging.consi.cloud/assets/main-D0plzFzA.js")
).text();
let from = 0;
let n = 0;
console.log("\n==== main attachment routes");
while (n < 20) {
  const idx = main.indexOf("attachment", from);
  if (idx < 0) break;
  const snip = main.slice(Math.max(0, idx - 40), idx + 80);
  if (/path:|`\/|navigate|route/i.test(snip)) {
    console.log(snip.replace(/\n/g, " "));
  }
  from = idx + 10;
  n++;
}

const paths = [...main.matchAll(/path:`\/[^`]+`/g)].map((m) => m[0]);
console.log("\nall paths", [...new Set(paths)]);
