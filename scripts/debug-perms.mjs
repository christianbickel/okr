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
  JSON.stringify(
    await gql(`{
      me {
        id
        user {
          id
          displayName
          email
          roles { __typename ... on BasicRole { id name permissions } ... on Team { id name } }
        }
      }
      possibleServiceUserPermissions
      # Inspiration exists? try create
    }`),
    null,
    2
  )
);

// Can we create Inspiration / Project?
console.log(
  "createInspiration",
  JSON.stringify(
    await gql(
      `mutation($input: CreateInspirationInput!) {
        createInspiration(input: $input) {
          inspiration { id displayName }
        }
      }`,
      { input: { dataEntry: { title: "OKR perm probe" } } }
    ),
    null,
    2
  )
);

console.log(
  "createProject",
  JSON.stringify(
    await gql(
      `mutation($input: CreateProjectInput!) {
        createProject(input: $input) {
          project { id displayName }
        }
      }`,
      {
        input: {
          dataEntry: {
            name: "OKR perm probe project",
          },
        },
      }
    ),
    null,
    2
  )
);

// DataType for OkrCycle?
console.log(
  "okr types",
  JSON.stringify(
    await gql(`{
      dataForm(dataCollection: "OkrCycle") {
        id
        types { key displayName archived level color }
        canBeDeleted
      }
    }`),
    null,
    2
  )
);

// CreateDataTypeInput
console.log(
  "CreateDataTypeInput",
  JSON.stringify(
    await gql(`{
      __type(name: "CreateDataTypeInput") {
        inputFields { name type { kind name ofType { kind name ofType { name } } } }
      }
    }`),
    null,
    2
  )
);

const roles = await gql(`{ roles { id name } }`);
const admin = roles.data.roles.find((r) => r.name === "Administrator");
console.log("admin", admin);

const edit = await gql(
  `mutation($input: EditSecurityTemplateInput!) {
    editSecurityTemplate(input: $input) {
      __typename
      ... on EditSecurityTemplatePayload {
        securityTemplateProvider {
          id
          securityTemplate { key { __typename ... on BasicRole { id name } ... on User { id } } value }
        }
      }
      ... on Error { message }
    }
  }`,
  {
    input: {
      id: "RGF0YUZvcm06RGF0YUZvcm0vT2tyQ3ljbGU=",
      template: [
        { key: { roleId: admin.id }, value: "Manage" },
        {
          key: {
            userId: (await gql(`{ me { id } }`)).data.me.id,
          },
          value: "Manage",
        },
      ],
    },
  }
);
console.log("editSecurity", JSON.stringify(edit, null, 2));

console.log(
  "create cycle after",
  JSON.stringify(
    await gql(
      `mutation($input: CreateOkrCycleInput!) {
        createOkrCycle(input: $input) {
          okrCycle { id displayName }
        }
      }`,
      {
        input: {
          dataEntry: {
            title: "Q4 2026",
            startDate: "2026-10-01",
            endDate: "2026-12-31",
            cycleType: 0,
            status: 1,
          },
        },
      }
    ),
    null,
    2
  )
);
