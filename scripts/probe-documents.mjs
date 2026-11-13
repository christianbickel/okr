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

const queryType = await gql(`{ __type(name: "Query") { fields { name } } }`);
const fields = queryType.data.__type.fields.map((f) => f.name);
console.log(
  "query document-ish",
  fields.filter((n) =>
    /doc|file|attach|media|thumb|blob|binary|download|upload|task|project/i.test(
      n
    )
  )
);

for (const name of [
  "Document",
  "File",
  "Attachment",
  "Media",
  "Binary",
  "Task",
  "Project",
  "DocumentFields",
  "TaskFields",
  "IDataEntry",
  "DataEntryConnection",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      fields { name type { kind name ofType { kind name ofType { name } } } }
      possibleTypes { name }
    }
  }`);
  const type = t.data?.__type;
  if (!type) {
    console.log(name, "MISSING");
    continue;
  }
  console.log("\n====", name, type.kind);
  if (type.possibleTypes?.length) {
    console.log(
      "possibleTypes",
      type.possibleTypes.map((p) => p.name).join(", ")
    );
  }
  if (type.fields) {
    const interesting = type.fields.filter((f) =>
      /thumb|preview|file|attach|url|blob|mime|size|owner|project|task|type|name|icon|image|download|content|binary|media|responsible|verantwort|assignee|user/i.test(
        f.name
      )
    );
    console.log(
      "interesting fields",
      interesting.map(
        (f) =>
          `${f.name}: ${f.type.name || f.type.kind + ">" + (f.type.ofType?.name || f.type.ofType?.ofType?.name || "")}`
      )
    );
    if (name === "Document" || name === "DocumentFields" || name === "Task" || name === "TaskFields" || name === "IDataEntry") {
      console.log(
        "ALL fields",
        type.fields.map((f) => f.name).join(", ")
      );
    }
  }
}
