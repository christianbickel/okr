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

const RULE_FIELDS = `
  key {
    __typename
    ... on User { id displayName: name }
    ... on BasicRole { id name }
    ... on Team { id name }
    ... on SecurityGroup { id name }
  }
  value
`;

// Discover working principal fields
let projectSec = await gql(`{
  dataForm(dataCollection: "Project") {
    id
    securityTemplate { key { __typename } value }
  }
}`);
console.log("project probe1", JSON.stringify(projectSec, null, 2));

projectSec = await gql(`{
  dataForm(dataCollection: "Project") {
    id displayName
    securityTemplate {
      key {
        __typename
        ... on BasicRole { id name }
        ... on Team { id name }
        ... on User { id }
        ... on SecurityGroup { id }
      }
      value
    }
  }
  okr: dataForm(dataCollection: "OkrCycle") {
    id displayName
    securityTemplate {
      key { __typename ... on BasicRole { id name } ... on Team { id name } ... on User { id } ... on SecurityGroup { id } }
      value
    }
  }
}`);
console.log("forms security", JSON.stringify(projectSec, null, 2));

const roles = await gql(`{
  roles {
    __typename
    ... on BasicRole { id name isSystemRole isDefault }
    ... on Team { id name }
  }
}`);
console.log(
  "system/default roles",
  JSON.stringify(
    (roles.data?.roles || []).filter(
      (r) => r.isSystemRole || r.isDefault || r.name === "Administrator"
    ),
    null,
    2
  )
);

const adminRole = (roles.data?.roles || []).find(
  (r) => r.name === "Administrator"
);
console.log("adminRole", adminRole);

const collections = ["OkrCycle", "OkrObjective", "OkrKeyResult", "OkrCheckIn"];

for (const dc of collections) {
  const form = await gql(
    `query($dc: DataCollection!) {
      dataForm(dataCollection: $dc) { id displayName }
    }`,
    { dc }
  );
  const id = form.data?.dataForm?.id;
  if (!id) {
    console.log(dc, "no form", form);
    continue;
  }

  // Grant Administrator Manage — needed to create/list entries
  const template = [
    {
      key: { roleId: adminRole.id },
      value: "Manage",
    },
  ];

  // Also try granting the service user directly
  const me = await gql(`{ me { id } }`);
  template.push({
    key: { userId: me.data.me.id },
    value: "Manage",
  });

  const edit = await gql(
    `mutation($input: EditSecurityTemplateInput!) {
      editSecurityTemplate(input: $input) {
        ... on EditSecurityTemplatePayload {
          securityTemplateProvider {
            id
            securityTemplate {
              key { __typename ... on BasicRole { id name } ... on User { id } }
              value
            }
          }
        }
        ... on Error { message }
      }
    }`,
    { input: { id, template } }
  );
  console.log("\nedit", dc, JSON.stringify(edit, null, 2));
}

// Retry create
const create = await gql(
  `mutation($input: CreateOkrCycleInput!) {
    createOkrCycle(input: $input) {
      okrCycle {
        id
        displayName
        values {
          title
          cycleType { id value }
          status { id value }
        }
      }
    }
  }`,
  {
    input: {
      dataEntry: {
        title: "Q4 2026",
        description: { htmlText: "<p>adsf</p>" },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0,
        status: 1,
      },
      securityRules: [
        { key: { roleId: adminRole.id }, value: "Manage" },
        { key: { userId: (await gql(`{ me { id } }`)).data.me.id }, value: "Manage" },
      ],
    },
  }
);
console.log("\ncreate after fix", JSON.stringify(create, null, 2));
