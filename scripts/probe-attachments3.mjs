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

async function gql(query, variables) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CONSOLIDATE_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const sample = await gql(`{
  dataEntries_Task(take: 100) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage }
    items {
      id
      displayName
      databaseId
      attachmentsCount
      dataTypes { key displayName color level }
      values {
        subject
        responsible { id displayName databaseId }
        project { id displayName databaseId }
      }
      attachments {
        id
        name
        size
        contentType
        downloadUrl
        previewType
        databaseId
        created
        createdBy { id displayName }
      }
    }
  }
}`);

if (sample.errors) {
  console.log("errors", JSON.stringify(sample.errors, null, 2));
  process.exit(1);
}

const items = sample.data.dataEntries_Task.items;
console.log(
  "total",
  sample.data.dataEntries_Task.totalCount,
  "fetched",
  items.length,
  "pageInfo",
  sample.data.dataEntries_Task.pageInfo
);
const withAtt = items.filter((t) => t.attachmentsCount > 0);
console.log("withAtt", withAtt.length);

let firstUrl = null;
for (const t of withAtt.slice(0, 10)) {
  console.log(
    JSON.stringify(
      {
        id: t.id,
        name: t.displayName,
        types: t.dataTypes,
        project: t.values.project,
        responsible: t.values.responsible,
        attachments: t.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.contentType,
          preview: a.previewType,
          size: a.size,
          url: a.downloadUrl,
        })),
      },
      null,
      2
    )
  );
  if (!firstUrl && t.attachments?.[0]?.downloadUrl) {
    firstUrl = t.attachments[0].downloadUrl;
  }
}

if (firstUrl) {
  console.log("\nHEAD downloadUrl", firstUrl);
  const head = await fetch(firstUrl, {
    method: "GET",
    headers: { "X-API-Key": env.CONSOLIDATE_API_KEY },
    redirect: "manual",
  });
  console.log("status", head.status, "ct", head.headers.get("content-type"));
  console.log("location", head.headers.get("location"));
  // Try relative preview paths used by SPA
  const abs = firstUrl.startsWith("http")
    ? firstUrl
    : new URL(firstUrl, env.CONSOLIDATE_API_URL).toString();
  console.log("absolute", abs);
}

// Search SPA for attachment preview / thumbnail
const main = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();
const assetNames = [
  ...new Set(
    [...main.matchAll(/assets\/([A-Za-z0-9_-]+\.js)/g)].map((m) => m[1])
  ),
];
const hits = [];
for (const name of assetNames) {
  const js = await (
    await fetch(`https://staging.consi.cloud/assets/${name}`)
  ).text();
  if (
    /thumbnail|previewUrl|attachment.*preview|\/preview\//i.test(js) &&
    /attachment/i.test(js)
  ) {
    hits.push(name);
    for (const key of [
      "thumbnail",
      "previewUrl",
      "/preview/",
      "PreviewType",
      "downloadUrl",
      "`/attachment",
      "/attachments/",
    ]) {
      let from = 0;
      let n = 0;
      while (n < 3) {
        const i = js.indexOf(key, from);
        if (i < 0) break;
        console.log("\n", name, key, js.slice(Math.max(0, i - 60), i + 100).replace(/\n/g, " "));
        from = i + key.length;
        n++;
      }
    }
  }
}
console.log("hit assets", hits);
