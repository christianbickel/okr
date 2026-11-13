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

async function create(input) {
  const json = await gql(
    `mutation($input: CreateDataFormInput!) {
      createDataForm(input: $input) {
        dataForm { id displayName dataCollection }
        errors { __typename ... on Error { message } }
      }
    }`,
    { input }
  );
  console.log(input.dataCollection, JSON.stringify(json, null, 2));
  return json;
}

await create({
  dataCollection: "OkrKeyResult",
  prefix: "KR",
  displayName: "OKR Key Result",
  icon: "Chart",
  color: "Teal",
  allowMultipleTypes: false,
  allowCommenting: true,
  allowInactive: true,
  allowAttachments: false,
  displayFields: ["title", "metricType", "currentValue", "status"],
  fields: [
    vf({ key: "title", label: "Key Result", required: true, valueType: "Text" }),
    vf({ key: "description", label: "Beschreibung", required: false, valueType: "RichText" }),
    vf({ key: "objective", label: "Objective", required: true, valueType: "DataEntry", dataCollection: "OkrObjective", size: "Half" }),
    vf({ key: "owner", label: "Owner", required: true, valueType: "User", size: "Half" }),
    vf({ key: "metricType", label: "Metrik", required: true, valueType: "ComboBox", comboBoxOptions: ["percent", "currency", "number", "boolean"], size: "Third" }),
    vf({ key: "unit", label: "Einheit", required: false, valueType: "Text", size: "Third" }),
    vf({ key: "status", label: "Status", required: true, valueType: "ComboBox", comboBoxOptions: ["on_track", "at_risk", "off_track"], size: "Third" }),
    vf({ key: "startValue", label: "Startwert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" }),
    vf({ key: "targetValue", label: "Zielwert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" }),
    vf({ key: "currentValue", label: "Ist-Wert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" }),
    vf({ key: "weight", label: "Gewicht", required: true, valueType: "Number", maxDecimals: 2, size: "Half" }),
    vf({ key: "dueDate", label: "Fällig", required: false, valueType: "Date", size: "Half" }),
  ],
});

await create({
  dataCollection: "OkrCheckIn",
  prefix: "CHK",
  displayName: "OKR Check-in",
  icon: "Check",
  color: "Green",
  allowMultipleTypes: false,
  allowCommenting: false,
  allowInactive: true,
  allowAttachments: false,
  displayFields: ["title", "status", "value", "checkInDate"],
  fields: [
    vf({ key: "title", label: "Titel", required: true, valueType: "Text" }),
    vf({ key: "keyResult", label: "Key Result", required: true, valueType: "DataEntry", dataCollection: "OkrKeyResult", size: "Half" }),
    vf({ key: "author", label: "Autor", required: true, valueType: "User", size: "Half" }),
    vf({ key: "value", label: "Neuer Wert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" }),
    vf({ key: "status", label: "Ampel", required: true, valueType: "ComboBox", comboBoxOptions: ["on_track", "at_risk", "off_track"], size: "Third" }),
    vf({ key: "checkInDate", label: "Datum", required: true, valueType: "Date", size: "Third" }),
    vf({ key: "comment", label: "Kommentar", required: false, valueType: "Text" }),
  ],
});

// Add parentObjective via update
const forms = await gql(`{
  dataForms {
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

const objective = forms.data.dataForms.find((f) => f.dataCollection === "OkrObjective");
console.log("objective form id", objective?.id);

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

if (objective) {
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
  console.log("update objective", JSON.stringify(update, null, 2));
}
