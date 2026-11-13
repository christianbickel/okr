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

const me = await gql(`{ me { id user { id displayName email } } }`);
console.log("me", JSON.stringify(me.data.me));

const perms = await gql(`{
  possibleServiceUserPermissions { key value category }
}`);
console.log("service perms", JSON.stringify(perms.data?.possibleServiceUserPermissions, null, 2));

const adminId = "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y";
const userId = me.data.me.id;

for (const dc of ["OkrCycle", "OkrObjective", "OkrKeyResult", "OkrCheckIn"]) {
  const form = await gql(
    `query($dc: DataCollection!) { dataForm(dataCollection: $dc) { id } }`,
    { dc }
  );
  const id = form.data.dataForm.id;
  const result = await gql(
    `mutation($input: EditSecurityTemplateInput!) {
      editSecurityTemplate(input: $input) {
        iSecurityTemplateProvider {
          id
          securityTemplate {
            key {
              __typename
              ... on BasicRole { id name }
              ... on User { id displayName }
            }
            value
          }
        }
      }
    }`,
    {
      input: {
        id,
        template: [
          { key: { roleId: adminId }, value: "Manage" },
          { key: { userId }, value: "Manage" },
        ],
      },
    }
  );
  console.log("edit", dc, JSON.stringify(result));
}

console.log(
  "create",
  JSON.stringify(
    await gql(
      `mutation($input: CreateOkrCycleInput!) {
        createOkrCycle(input: $input) { okrCycle { id displayName } }
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
          securityRules: [
            { key: { roleId: adminId }, value: "Manage" },
            { key: { userId }, value: "Manage" },
          ],
        },
      }
    ),
    null,
    2
  )
);
