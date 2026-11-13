import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

async function gql(query, variables, apiKey = env.CONSOLIDATE_API_KEY) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const me = await gql(`{ me { id user { email displayName } } }`);
console.log("me", JSON.stringify(me, null, 2));

// Try Project attachments
const projects = await gql(`{
  dataEntries_Project(take: 20) {
    totalCount
    items {
      id
      displayName
      attachmentsCount
      attachments { id name contentType downloadUrl previewType size }
    }
  }
}`);
console.log("projects", JSON.stringify(projects, null, 2)?.slice(0, 3000));

// Try filter on tasks - maybe need level?
const levels = await gql(`{
  __type(name: "TaskLevel") { enumValues { name } }
}`);
console.log("TaskLevel", levels.data?.__type?.enumValues);

for (const level of levels.data?.__type?.enumValues?.map((e) => e.name) ?? []) {
  const r = await gql(`query($level: TaskLevel) {
    dataEntries_Task(take: 5, level: $level) { totalCount items { id displayName attachmentsCount } }
  }`, { level });
  console.log("level", level, r.data?.dataEntries_Task?.totalCount, r.errors?.[0]?.message);
}

// Search all JS for attachment preview path without requiring both keywords
const html = await (await fetch("https://staging.consi.cloud/")).text();
const mainSrc = html.match(/src="(\/assets\/main-[^"]+\.js)"/)?.[1];
console.log("main", mainSrc);
const main = await (await fetch(`https://staging.consi.cloud${mainSrc}`)).text();
const assetNames = [
  ...new Set(
    [...main.matchAll(/assets\/([A-Za-z0-9_-]+\.js)/g)].map((m) => m[1])
  ),
];

for (const name of assetNames) {
  const js = await (
    await fetch(`https://staging.consi.cloud/assets/${name}`)
  ).text();
  if (!/downloadUrl|PreviewType|previewType|thumbnail/i.test(js)) continue;
  console.log("\n==== candidate", name, js.length);
  for (const key of [
    "thumbnail",
    "previewType",
    "downloadUrl",
    "/files/",
    "/attachments/",
    "attachment/",
    "PreviewType.Image",
    "getPreview",
  ]) {
    let from = 0;
    let n = 0;
    while (n < 2) {
      const i = js.indexOf(key, from);
      if (i < 0) break;
      console.log(key, "@", i, js.slice(Math.max(0, i - 50), i + 90).replace(/\n/g, " "));
      from = i + key.length;
      n++;
    }
  }
}
