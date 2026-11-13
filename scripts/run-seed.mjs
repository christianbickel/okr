/**
 * Seed/repair OKR DataForms against credentials in .env.local
 * (or args: node scripts/run-seed.mjs <apiUrl> <apiKey>)
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  if (process.argv[2] && process.argv[3]) {
    return { apiUrl: process.argv[2], apiKey: process.argv[3] };
  }
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );
  return { apiUrl: env.CONSOLIDATE_API_URL, apiKey: env.CONSOLIDATE_API_KEY };
}

function valueField(def) {
  const value = {
    key: def.key,
    label: def.label,
    required: def.required,
    valueType: def.valueType,
    selectionType: def.selectionType ?? "Single",
    searchable: def.searchable ?? true,
    archived: false,
    validators: [],
    security: [],
    allowedValues: [],
    requiresManagePermissions: false,
    section: def.section ?? "Main",
    size: def.size ?? "Full",
  };
  if (def.dataCollection) value.dataCollection = def.dataCollection;
  if (def.helpText) value.helpText = def.helpText;
  if (def.comboBoxOptions?.length) value.comboBoxOptions = def.comboBoxOptions;
  if (typeof def.maxDecimals === "number") value.maxDecimals = def.maxDecimals;
  return { value };
}

const forms = [
  {
    dataCollection: "OkrCycle",
    prefix: "CYC",
    displayName: "OKR Zyklus",
    icon: "Calendar",
    color: "Blue",
    allowMultipleTypes: false,
    allowCommenting: true,
    allowInactive: true,
    allowAttachments: false,
    displayFields: ["title", "startDate", "endDate"],
    fields: [
      { key: "title", label: "Titel", required: true, valueType: "Text" },
      { key: "description", label: "Beschreibung", required: false, valueType: "RichText" },
      { key: "startDate", label: "Start", required: true, valueType: "Date", size: "Half" },
      { key: "endDate", label: "Ende", required: true, valueType: "Date", size: "Half" },
      { key: "cycleType", label: "Typ", required: true, valueType: "ComboBox", comboBoxOptions: ["quarter", "year", "custom"], size: "Half" },
      { key: "status", label: "Status", required: true, valueType: "ComboBox", comboBoxOptions: ["draft", "active", "closed"], size: "Half" },
    ],
  },
  {
    dataCollection: "OkrObjective",
    prefix: "OBJ",
    displayName: "OKR Objective",
    icon: "Target",
    color: "Purple",
    allowMultipleTypes: false,
    allowCommenting: true,
    allowInactive: true,
    allowAttachments: true,
    displayFields: ["title", "progress"],
    fields: [
      { key: "title", label: "Objective", required: true, valueType: "Text" },
      { key: "description", label: "Beschreibung", required: false, valueType: "RichText" },
      { key: "level", label: "Ebene", required: true, valueType: "ComboBox", comboBoxOptions: ["company", "team", "individual"], size: "Third" },
      { key: "cycleId", label: "Zyklus-ID", required: true, valueType: "Text", size: "Third", helpText: "Consolidate-ID des OkrCycle-Eintrags" },
      { key: "status", label: "Status", required: true, valueType: "ComboBox", comboBoxOptions: ["draft", "on_track", "at_risk", "off_track", "completed"], size: "Third" },
      { key: "parentObjectiveId", label: "Parent-Objective-ID", required: false, valueType: "Text", size: "Half", helpText: "Alignment: ID des übergeordneten Objectives" },
      { key: "owner", label: "Owner", required: true, valueType: "User", size: "Half" },
      { key: "teamId", label: "Team-ID", required: false, valueType: "Text", size: "Half", section: "Additional" },
      { key: "teamName", label: "Team", required: false, valueType: "Text", size: "Half", section: "Additional" },
      { key: "progress", label: "Fortschritt %", required: true, valueType: "Number", maxDecimals: 1, size: "Half", helpText: "Automatisch aus gewichteten Key Results berechnet" },
      { key: "weight", label: "Gewicht", required: false, valueType: "Number", maxDecimals: 2, size: "Half" },
    ],
  },
  {
    dataCollection: "OkrKeyResult",
    prefix: "KR",
    displayName: "OKR Key Result",
    icon: "Chart",
    color: "Teal",
    allowMultipleTypes: false,
    allowCommenting: true,
    allowInactive: true,
    allowAttachments: false,
    displayFields: ["title", "currentValue"],
    fields: [
      { key: "title", label: "Key Result", required: true, valueType: "Text" },
      { key: "description", label: "Beschreibung", required: false, valueType: "RichText" },
      { key: "objectiveId", label: "Objective-ID", required: true, valueType: "Text", size: "Half", helpText: "Consolidate-ID des OkrObjective-Eintrags" },
      { key: "owner", label: "Owner", required: true, valueType: "User", size: "Half" },
      { key: "metricType", label: "Metrik", required: true, valueType: "ComboBox", comboBoxOptions: ["percent", "currency", "number", "boolean"], size: "Third" },
      { key: "unit", label: "Einheit", required: false, valueType: "Text", size: "Third" },
      { key: "status", label: "Status", required: true, valueType: "ComboBox", comboBoxOptions: ["on_track", "at_risk", "off_track"], size: "Third" },
      { key: "startValue", label: "Startwert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" },
      { key: "targetValue", label: "Zielwert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" },
      { key: "currentValue", label: "Ist-Wert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" },
      { key: "weight", label: "Gewicht", required: true, valueType: "Number", maxDecimals: 2, size: "Half" },
      { key: "dueDate", label: "Fällig", required: false, valueType: "Date", size: "Half" },
    ],
  },
  {
    dataCollection: "OkrCheckIn",
    prefix: "CHK",
    displayName: "OKR Check-in",
    icon: "Check",
    color: "Green",
    allowMultipleTypes: false,
    allowCommenting: false,
    allowInactive: true,
    allowAttachments: false,
    displayFields: ["title", "value", "checkInDate"],
    fields: [
      { key: "title", label: "Titel", required: true, valueType: "Text" },
      { key: "keyResultId", label: "Key-Result-ID", required: true, valueType: "Text", size: "Half", helpText: "Consolidate-ID des OkrKeyResult-Eintrags" },
      { key: "author", label: "Autor", required: true, valueType: "User", size: "Half" },
      { key: "value", label: "Neuer Wert", required: true, valueType: "Number", maxDecimals: 4, size: "Third" },
      { key: "status", label: "Ampel", required: true, valueType: "ComboBox", comboBoxOptions: ["on_track", "at_risk", "off_track"], size: "Third" },
      { key: "checkInDate", label: "Datum", required: true, valueType: "Date", size: "Third" },
      { key: "comment", label: "Kommentar", required: false, valueType: "Text" },
    ],
  },
];

async function gql(apiUrl, apiKey, query, variables) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

function existingToInput(field) {
  if (field.__typename === "ValueFieldDefinition") {
    return valueField({
      key: field.key,
      label: field.label,
      required: field.required,
      valueType: field.valueType,
      selectionType: field.selectionType,
      dataCollection: field.dataCollection || undefined,
      searchable: field.searchable,
      section: field.section,
      size: field.size,
      helpText: field.helpText || undefined,
      maxDecimals: field.maxDecimals ?? undefined,
      comboBoxOptions: field.comboBoxOptions?.map((o) => o.value),
    });
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

async function syncForm(apiUrl, apiKey, definition) {
  const formJson = await gql(
    apiUrl,
    apiKey,
    `query($dc: DataCollection!) {
      dataForm(dataCollection: $dc) {
        id displayName icon color allowMultipleTypes allowCommenting allowInactive allowAttachments displayFields
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
    }`,
    { dc: definition.dataCollection }
  );

  const dataForm = formJson.data?.dataForm;
  if (!dataForm) {
    return { status: "failed", message: "Formular nicht lesbar" };
  }

  const existingKeys = new Set(
    dataForm.fields
      .filter((f) => f.__typename === "ValueFieldDefinition")
      .map((f) => f.key)
  );
  const missing = definition.fields.filter((f) => !existingKeys.has(f.key));
  const hasPlaceholders = dataForm.fields.some(
    (f) =>
      f.__typename === "DisplayFieldDefinition" &&
      (f.key === "___placeholder" || f.displayType === "Placeholder")
  );

  if (missing.length === 0 && !hasPlaceholders) {
    return { status: "exists", message: "bereits vorhanden (Felder OK)", id: dataForm.id };
  }

  const fields = [
    ...dataForm.fields
      .filter(
        (f) =>
          !(
            f.__typename === "DisplayFieldDefinition" &&
            (f.key === "___placeholder" || f.displayType === "Placeholder")
          )
      )
      .map(existingToInput),
    ...missing.map(valueField),
  ];

  const displayFields = definition.displayFields.filter((key) =>
    fields.some((f) => f.value?.key === key)
  );

  const update = await gql(
    apiUrl,
    apiKey,
    `mutation($input: UpdateDataFormInput!) {
      updateDataForm(input: $input) {
        dataForm { id displayName }
        errors { __typename ... on Error { message } }
      }
    }`,
    {
      input: {
        id: dataForm.id,
        displayName: definition.displayName,
        color: definition.color,
        icon: definition.icon,
        allowMultipleTypes: definition.allowMultipleTypes,
        allowCommenting: definition.allowCommenting,
        allowInactive: definition.allowInactive,
        allowAttachments: definition.allowAttachments,
        displayFields:
          displayFields.length > 0 ? displayFields : dataForm.displayFields,
        fields,
      },
    }
  );

  const errors = update.data?.updateDataForm?.errors ?? [];
  if (update.errors?.length || errors.length || !update.data?.updateDataForm?.dataForm) {
    return {
      status: "failed",
      message:
        update.errors?.[0]?.message ||
        errors.map((e) => e.message || e.__typename).join("; ") ||
        "Update fehlgeschlagen",
      id: dataForm.id,
    };
  }

  return {
    status: "exists",
    message: `sync (+${missing.map((m) => m.key).join(", ") || "placeholder cleanup"})`,
    id: dataForm.id,
  };
}

async function upsert(apiUrl, apiKey, definition) {
  const input = {
    ...definition,
    fields: definition.fields.map(valueField),
  };

  const created = await gql(
    apiUrl,
    apiKey,
    `mutation($input: CreateDataFormInput!) {
      createDataForm(input: $input) {
        dataForm { id displayName idPrefix }
        errors { __typename ... on Error { message } }
      }
    }`,
    { input }
  );

  if (created.errors?.length) {
    return { status: "failed", message: created.errors[0].message };
  }

  const payload = created.data?.createDataForm;
  const errors = payload?.errors ?? [];
  if (errors.some((e) => e.__typename === "DataCollectionAlreadyExistsError")) {
    return syncForm(apiUrl, apiKey, definition);
  }
  if (errors.length) {
    return {
      status: "failed",
      message: errors.map((e) => e.message || e.__typename).join("; "),
    };
  }
  if (!payload?.dataForm) {
    return { status: "failed", message: "Keine DataForm-Antwort" };
  }

  const synced = await syncForm(apiUrl, apiKey, definition);
  return {
    status: synced.status === "failed" ? "failed" : "created",
    message:
      synced.status === "failed"
        ? synced.message
        : `${payload.dataForm.displayName} (${payload.dataForm.idPrefix})`,
    id: payload.dataForm.id,
  };
}

const { apiUrl, apiKey } = loadEnv();
if (!apiUrl || !apiKey) {
  console.error("Missing API URL / API key");
  process.exit(1);
}

console.log("Seeding", apiUrl);
const results = [];
for (const form of forms) {
  const row = await upsert(apiUrl, apiKey, form);
  results.push({ dataCollection: form.dataCollection, ...row });
  console.log(row.status.toUpperCase().padEnd(8), form.dataCollection, row.message || "");
}

const failed = results.filter((r) => r.status === "failed");
process.exit(failed.length ? 1 : 0);
