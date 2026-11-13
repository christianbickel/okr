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
  "EntitySecurityRuleInput",
  "AccessLevel",
  "SecurityTemplate",
  "UpdateDataEntrySecurityInput",
  "DataForm",
  "DataTypeSecurity",
  "FieldSecurityRuleInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      description
      enumValues { name }
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
      fields { name type { kind name ofType { name kind ofType { name } } } }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

const templates = await gql(`{
  securityTemplates {
    items {
      id
      key
      displayName
      description
    }
  }
}`);
console.log("\n=== templates", JSON.stringify(templates, null, 2));

const roles = await gql(`{
  roles { id name key }
  activeTeams { id name }
}`);
console.log("\n=== roles/teams", JSON.stringify(roles, null, 2));

// mutation args for updateDataForm / create - any security?
const mut = await gql(`{
  __type(name: "Mutation") {
    fields {
      name
      args { name type { name kind ofType { name } } }
    }
  }
}`);
const interesting = mut.data.__type.fields.filter((f) =>
  /security|Security|permission|Permission|template/i.test(f.name)
);
console.log(
  "\n=== security mutations",
  interesting.map((f) => ({ name: f.name, args: f.args }))
);
