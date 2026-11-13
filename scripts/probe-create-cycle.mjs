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

console.log(
  "me",
  JSON.stringify(
    await gql(`{
      me {
        id
        user { email displayName }
      }
      serverSettings { __typename }
    }`),
    null,
    2
  )
);

// Try group field + value field
const input = {
  dataCollection: "OkrProbeGroup1",
  prefix: "OPG",
  displayName: "OKR Probe Group",
  icon: "Star",
  color: "Blue",
  allowMultipleTypes: false,
  allowCommenting: true,
  allowInactive: true,
  allowAttachments: false,
  displayFields: ["title"],
  fields: [
    {
      group: {
        key: "mainGroup",
        label: "Allgemein",
        section: "Main",
        size: "Full",
      },
    },
    {
      value: {
        key: "title",
        label: "Titel",
        required: true,
        valueType: "Text",
        selectionType: "Single",
        searchable: true,
        archived: false,
        validators: [],
        requiresManagePermissions: false,
        section: "Main",
        fieldGroup: "mainGroup",
        size: "Full",
        security: [],
        allowedValues: [],
      },
    },
  ],
};

console.log(
  "group+value",
  JSON.stringify(
    await gql(
      `mutation($input: CreateDataFormInput!) {
        createDataForm(input: $input) {
          dataForm { id displayName dataCollection }
          errors { __typename ... on Error { message } }
        }
      }`,
      { input }
    ),
    null,
    2
  )
);

// Try only with security: [] and allowedValues: []
const input2 = {
  ...input,
  dataCollection: "OkrProbePlain2",
  prefix: "OPP",
  displayName: "OKR Probe Plain 2",
  fields: [
    {
      value: {
        key: "title",
        label: "Titel",
        required: true,
        valueType: "Text",
        selectionType: "Single",
        searchable: true,
        archived: false,
        validators: [],
        requiresManagePermissions: false,
        section: "Main",
        size: "Full",
        security: [],
        allowedValues: [],
      },
    },
  ],
};

console.log(
  "plain+empty-lists",
  JSON.stringify(
    await gql(
      `mutation($input: CreateDataFormInput!) {
        createDataForm(input: $input) {
          dataForm { id displayName dataCollection }
          errors { __typename ... on Error { message } }
        }
      }`,
      { input: input2 }
    ),
    null,
    2
  )
);
