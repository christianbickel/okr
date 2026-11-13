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

// Attachments field type on Task
const task = await gql(`{
  __type(name: "Task") {
    fields {
      name
      args { name type { kind name ofType { name kind ofType { name } } } }
      type { kind name ofType { kind name ofType { name kind ofType { name } } } }
    }
  }
}`);
const attField = task.data.__type.fields.find((f) => f.name === "attachments");
console.log("Task.attachments", JSON.stringify(attField, null, 2));

const dataTypes = task.data.__type.fields.find((f) => f.name === "dataTypes");
console.log("Task.dataTypes", JSON.stringify(dataTypes, null, 2));

// Sample
const sample = await gql(`{
  dataEntries_Task(take: 50) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage }
    items {
      id
      displayName
      databaseId
      attachmentsCount
      dataTypes { key displayName color { __typename } level }
      values {
        subject
        responsible { id displayName databaseId ... on User { email } }
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
} else {
  const items = sample.data.dataEntries_Task.items;
  console.log(
    "total",
    sample.data.dataEntries_Task.totalCount,
    "pageInfo",
    sample.data.dataEntries_Task.pageInfo
  );
  const withAtt = items.filter((t) => t.attachmentsCount > 0);
  console.log("withAtt", withAtt.length, "of", items.length);
  for (const t of withAtt.slice(0, 8)) {
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
            url: a.downloadUrl?.slice(0, 80),
          })),
        },
        null,
        2
      )
    );
  }
}

// Look for thumbnail / preview URL patterns in Attachment or related
for (const name of ["Attachment", "EditorApp", "IDataEntry"]) {
  const t = await gql(`{
    __type(name: "${name}") {
      fields { name type { name kind ofType { name } } }
    }
  }`);
  console.log(
    name,
    "fields",
    t.data.__type.fields.map((f) => f.name).join(", ")
  );
}

// Check if downloadUrl works as preview, or if there's a separate preview endpoint
const filterType = await gql(`{
  __type(name: "IFilterableInput") {
    kind
    possibleTypes { name }
    inputFields { name type { name kind ofType { name } } }
  }
}`);
console.log("IFilterableInput", JSON.stringify(filterType.data.__type, null, 2)?.slice?.(0, 2000) || JSON.stringify(filterType.data.__type)?.slice(0, 2000));

// Search for filter types related to Task
const schema = await gql(`{
  __schema {
    types {
      name
      kind
    }
  }
}`);
const filterish = schema.data.__schema.types
  .map((t) => t.name)
  .filter((n) => /task|attach|filter|order/i.test(n || ""));
console.log("filterish types", filterish);
