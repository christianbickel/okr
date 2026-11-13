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

for (const name of [
  "SecurityPrincipalInput",
  "EntitySecurityRule",
  "EditSecurityTemplateInput",
  "ISecurityTemplateProvider",
  "Role",
  "SecurityPrincipal",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      enumValues { name }
      possibleTypes { name }
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
      fields { name type { kind name ofType { name kind ofType { name } } } }
      interfaces { name }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

console.log(
  "\n=== templates",
  JSON.stringify(
    await gql(`{
      securityTemplates {
        items {
          __typename
          id
          ... on DataTypeSecurity {
            displayName
            dataFormId
            typeKey
            securityTemplate {
              accessLevel
              principal { __typename id }
            }
          }
        }
      }
    }`),
    null,
    2
  )
);

console.log(
  "\n=== project form security",
  JSON.stringify(
    await gql(`{
      dataForm(dataCollection: "Project") {
        displayName
        securityTemplate {
          accessLevel
          principal { __typename ... on User { id } ... on Role { id name } ... on Team { id name } }
        }
      }
      dataFormCycle: dataForm(dataCollection: "OkrCycle") {
        displayName
        securityTemplate {
          accessLevel
          principal { __typename }
        }
        types {
          key
          displayName
          securityTemplateKey
          securityTemplate {
            accessLevel
            principal { __typename }
          }
        }
      }
    }`),
    null,
    2
  )
);

console.log(
  "\n=== roles",
  JSON.stringify(await gql(`{ roles { id name } }`), null, 2)
);

console.log(
  "\n=== editSecurityTemplate field",
  JSON.stringify(
    await gql(`{
      __type(name: "Mutation") {
        fields {
          name
          args {
            name
            type { kind name ofType { kind name ofType { name } } }
          }
        }
      }
    }`).then((j) =>
      j.data.__type.fields.find((f) => f.name === "editSecurityTemplate")
    ),
    null,
    2
  )
);
