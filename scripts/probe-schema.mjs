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

function vf(def) {
  const v = {
    key: def.key,
    label: def.label,
    required: def.required,
    valueType: def.valueType,
    selectionType: "Single",
    searchable: true,
    archived: false,
    validators: [],
    security: [],
    allowedValues: [],
    requiresManagePermissions: false,
    section: def.section || "Main",
    size: def.size || "Full",
  };
  if (def.dataCollection) v.dataCollection = def.dataCollection;
  if (def.comboBoxOptions) v.comboBoxOptions = def.comboBoxOptions;
  if (def.maxDecimals != null) v.maxDecimals = def.maxDecimals;
  return { value: v };
}

const ids = [
  "RGF0YUZvcm06RGF0YUZvcm0vT2tyQ3ljbGU=",
  "RGF0YUZvcm06RGF0YUZvcm0vT2tyT2JqZWN0aXZl",
  "RGF0YUZvcm06RGF0YUZvcm0vT2tyS2V5UmVzdWx0",
  "RGF0YUZvcm06RGF0YUZvcm0vT2tyQ2hlY2tJbg==",
];

for (const id of ids) {
  const json = await gql(
    `query($id: ID!) { dataForm(id: $id) { id displayName dataCollection archived } }`,
    { id }
  );
  console.log(id, JSON.stringify(json));
}

console.log(
  "recreate objective",
  JSON.stringify(
    await gql(
      `mutation CreateDataForm($input: CreateDataFormInput!) {
        createDataForm(input: $input) {
          dataForm { id dataCollection }
          errors { __typename ... on Error { message } }
        }
      }`,
      {
        input: {
          dataCollection: "OkrObjective",
          prefix: "OBJ",
          displayName: "OKR Objective",
          icon: "Target",
          color: "Purple",
          allowMultipleTypes: false,
          allowCommenting: true,
          allowInactive: true,
          allowAttachments: true,
          displayFields: ["title", "status"],
          fields: [
            vf({ key: "title", label: "Objective", required: true, valueType: "Text" }),
            vf({
              key: "cycle",
              label: "Zyklus",
              required: true,
              valueType: "DataEntry",
              dataCollection: "OkrCycle",
              size: "Half",
            }),
            vf({
              key: "status",
              label: "Status",
              required: true,
              valueType: "ComboBox",
              comboBoxOptions: ["draft", "on_track", "at_risk", "off_track", "completed"],
              size: "Half",
            }),
            vf({ key: "owner", label: "Owner", required: true, valueType: "User", size: "Half" }),
            vf({
              key: "progress",
              label: "Fortschritt %",
              required: true,
              valueType: "Number",
              maxDecimals: 1,
              size: "Half",
            }),
          ],
        },
      }
    ),
    null,
    2
  )
);

await new Promise((r) => setTimeout(r, 3000));
const schema = await gql(`{ __schema { queryType { fields { name } } } }`);
console.log(
  "okr",
  schema.data.__schema.queryType.fields
    .map((f) => f.name)
    .filter((n) => /Okr|Probe/.test(n))
);
