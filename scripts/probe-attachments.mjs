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

async function typeFields(name) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      enumValues { name }
      fields {
        name
        args { name type { kind name ofType { name kind ofType { name } } } }
        type { kind name ofType { kind name ofType { name kind ofType { name } } } }
      }
    }
  }`);
  return t.data?.__type;
}

for (const name of [
  "Attachment",
  "AttachmentsCollectionSegment",
  "FileVersion",
  "PreviewType",
  "Query",
  "DataType",
  "Assignee",
  "TaskFilterInput",
  "TasksFilterInput",
  "TaskSortInput",
]) {
  const t = await typeFields(name);
  if (!t) {
    console.log(name, "MISSING");
    continue;
  }
  console.log("\n====", name, t.kind);
  if (t.enumValues) console.log(t.enumValues.map((e) => e.name).join(", "));
  if (t.fields) {
    for (const f of t.fields) {
      if (
        name === "Query" &&
        !/attach|task|thumb|preview|download/i.test(f.name)
      ) {
        continue;
      }
      const args =
        f.args?.length > 0
          ? `(${f.args.map((a) => a.name + ":" + (a.type.name || a.type.ofType?.name || a.type.kind)).join(", ")})`
          : "";
      const typ =
        f.type.name ||
        f.type.ofType?.name ||
        f.type.ofType?.ofType?.name ||
        f.type.kind;
      console.log(`  ${f.name}${args}: ${typ}`);
    }
  }
}

// Sample tasks with attachments
const sample = await gql(`{
  dataEntries_Task(take: 20, includeInactive: false) {
    totalCount
    items {
      id
      displayName
      databaseId
      attachmentsCount
      dataTypes { id name color level }
      values {
        subject
        responsible { ... on User { id displayName } ... on Contact { id displayName } }
        project { id displayName databaseId }
      }
      attachments {
        items {
          id
          name
          size
          contentType
          downloadUrl
          previewType
          created
        }
      }
    }
  }
}`);
console.log("\n==== sample tasks");
if (sample.errors) console.log("errors", JSON.stringify(sample.errors, null, 2));
const items = sample.data?.dataEntries_Task?.items ?? [];
console.log("total", sample.data?.dataEntries_Task?.totalCount, "fetched", items.length);
const withAtt = items.filter((t) => (t.attachmentsCount ?? 0) > 0);
console.log("with attachments", withAtt.length);
for (const t of withAtt.slice(0, 5)) {
  console.log(JSON.stringify({
    task: t.displayName,
    types: t.dataTypes,
    project: t.values?.project,
    responsible: t.values?.responsible,
    attachments: t.attachments?.items,
  }, null, 2));
}

// attachment(id) query args
const q = await gql(`{
  __type(name: "Query") {
    fields(includeDeprecated: true) {
      name
      args { name type { kind name ofType { name } } }
    }
  }
}`);
const att = q.data.__type.fields.find((f) => f.name === "attachment");
console.log("\nattachment query", JSON.stringify(att, null, 2));
