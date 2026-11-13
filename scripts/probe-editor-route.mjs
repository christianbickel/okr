const main = await (
  await fetch("https://staging.consi.cloud/assets/main-D0plzFzA.js")
).text();

let from = 0;
let n = 0;
console.log("==== /editor");
while (n < 30) {
  const i = main.indexOf("/editor", from);
  if (i < 0) break;
  console.log(main.slice(Math.max(0, i - 60), i + 100).replace(/\n/g, " "));
  from = i + 7;
  n++;
}

const pile = await (
  await fetch("https://staging.consi.cloud/assets/PileColorDot-D_REGSMC.js")
).text();

from = 0;
n = 0;
console.log("\n==== lE( editor helper");
const idx = pile.indexOf("lE=");
console.log(pile.slice(idx, idx + 400));

from = 0;
n = 0;
console.log("\n==== nE(");
while (n < 10) {
  const i = pile.indexOf("nE(", from);
  if (i < 0) break;
  console.log(pile.slice(Math.max(0, i - 40), i + 120).replace(/\n/g, " "));
  from = i + 3;
  n++;
}

// attachment selected on entry - search hash/searchParams
for (const key of [
  "attachmentId",
  "selectedAttachment",
  "searchParams",
  "attachments/",
  "preview=",
  "fileId",
]) {
  from = 0;
  n = 0;
  console.log("\n====", key);
  while (n < 4) {
    const i = pile.indexOf(key, from);
    if (i < 0) break;
    console.log(pile.slice(Math.max(0, i - 50), i + 100).replace(/\n/g, " "));
    from = i + key.length;
    n++;
  }
}
