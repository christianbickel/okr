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
  if (def.helpText) v.helpText = def.helpText;
  return { value: v };
}

function toInputField(field) {
  if (field.__typename === "ValueFieldDefinition") {
    const value = {
      key: field.key,
      label: field.label,
      required: field.required,
      valueType: field.valueType,
      selectionType: field.selectionType,
      searchable: field.searchable,
      archived: field.archived,
      validators: [],
      security: [],
      allowedValues: [],
      requiresManagePermissions: field.requiresManagePermissions,
      section: field.section,
      size: field.size,
    };
    if (field.dataCollection) value.dataCollection = field.dataCollection;
    if (field.helpText) value.helpText = field.helpText;
    if (field.fieldGroup) value.fieldGroup = field.fieldGroup;
    if (field.maxDecimals != null) value.maxDecimals = field.maxDecimals;
    if (field.comboBoxOptions?.length) {
      value.comboBoxOptions = field.comboBoxOptions.map((o) => o.value);
    }
    return { value };
  }
  if (field.__typename === "GroupFieldDefinition") {
    return {
      group: {
        key: field.key,
        label: field.label,
        section: field.section,
        size: field.size,
        ...(field.fieldGroup ? { fieldGroup: field.fieldGroup } : {}),
      },
    };
  }
  return {
    display: {
      key: field.key,
      label: field.label,
      displayType: field.displayType,
      section: field.section,
      size: field.size,
      ...(field.fieldGroup ? { fieldGroup: field.fieldGroup } : {}),
    },
  };
}

const formJson = await gql(`{
  dataForm(dataCollection: "OkrObjective") {
    id displayName dataCollection icon color
    allowMultipleTypes allowCommenting allowInactive allowAttachments
    displayFields
    fields {
      __typename
      ... on ValueFieldDefinition {
        key label required valueType selectionType dataCollection searchable archived
        comboBoxOptions { value } maxDecimals requiresManagePermissions section fieldGroup size helpText
      }
      ... on GroupFieldDefinition { key label section fieldGroup size }
      ... on DisplayFieldDefinition { key label displayType section fieldGroup size }
    }
  }
}`);

console.log("form", JSON.stringify(formJson, null, 2));
const objective = formJson.data?.dataForm;
if (!objective) process.exit(1);

const hasParent = objective.fields.some(
  (f) => f.__typename === "ValueFieldDefinition" && f.key === "parentObjective"
);

if (hasParent) {
  console.log("parentObjective already present");
  process.exit(0);
}

const fields = [
  ...objective.fields.map(toInputField),
  vf({
    key: "parentObjective",
    label: "Parent (Alignment)",
    required: false,
    valueType: "DataEntry",
    dataCollection: "OkrObjective",
    size: "Half",
  }),
  vf({
    key: "teamId",
    label: "Team-ID",
    required: false,
    valueType: "Text",
    size: "Half",
    section: "Additional",
  }),
  vf({
    key: "teamName",
    label: "Team",
    required: false,
    valueType: "Text",
    size: "Half",
    section: "Additional",
  }),
];

const update = await gql(
  `mutation($input: UpdateDataFormInput!) {
    updateDataForm(input: $input) {
      dataForm { id displayName }
      errors { __typename ... on Error { message } }
    }
  }`,
  {
    input: {
      id: objective.id,
      displayName: objective.displayName,
      color: objective.color,
      icon: objective.icon || "Target",
      allowMultipleTypes: objective.allowMultipleTypes,
      allowCommenting: objective.allowCommenting,
      allowInactive: objective.allowInactive,
      allowAttachments: objective.allowAttachments,
      displayFields: objective.displayFields,
      fields,
    },
  }
);

console.log("update", JSON.stringify(update, null, 2));
