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

const me = await gql(`{
  me { id user { id displayName email } }
  possibleServiceUserPermissions { key value category }
}`);

const okrPerms = (me.data?.possibleServiceUserPermissions || []).filter((p) =>
  /Okr|DataForms|EditUsers/i.test(p.key)
);
console.log("service user", me.data?.me?.user);
console.log("okr-related service perms:");
for (const p of okrPerms) console.log(`  ${p.value ? "ON " : "OFF"} ${p.key}`);

const form = await gql(`{
  dataForm(dataCollection: "OkrCycle") {
    id displayName idPrefix
    securityTemplate {
      key {
        __typename
        ... on BasicRole { id name }
        ... on User { id displayName }
        ... on Team { id name }
        ... on SecurityGroup { id }
      }
      value
    }
    fields {
      __typename
      ... on ValueFieldDefinition {
        key required valueType
        comboBoxOptions { id value }
      }
    }
  }
}`);
console.log("\nform securityTemplate", JSON.stringify(form.data?.dataForm?.securityTemplate));
console.log(
  "combo fields",
  form.data?.dataForm?.fields
    ?.filter((f) => f.valueType === "ComboBox")
    .map((f) => ({ key: f.key, options: f.comboBoxOptions }))
);

const attempts = [
  {
    name: "ui-equivalent",
    input: {
      dataEntry: {
        title: "Q4 2026",
        description: { htmlText: "<p></p>" },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0,
        status: 1,
      },
    },
  },
  {
    name: "with-admin-securityRules",
    input: {
      dataEntry: {
        title: "Q4 2026 b",
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0,
        status: 1,
      },
      securityRules: [
        {
          key: { roleId: "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y" },
          value: "Manage",
        },
      ],
    },
  },
];

for (const attempt of attempts) {
  const json = await gql(
    `mutation($input: CreateOkrCycleInput!) {
      createOkrCycle(input: $input) {
        okrCycle { id displayName }
      }
    }`,
    { input: attempt.input }
  );
  console.log(`\n${attempt.name}:`, JSON.stringify(json.errors || json.data));
}
