import "server-only";

import type { SeedCollectionResult } from "./config";
import { consolidateGraphql, ConsolidateApiError } from "./client";
import {
  OKR_DATA_FORMS,
  toCreateDataFormInput,
  valueFieldInput,
  type DataFormDefinition,
  type ValueFieldDef,
} from "./seed-definitions";

const CREATE_DATA_FORM = `
  mutation CreateDataForm($input: CreateDataFormInput!) {
    createDataForm(input: $input) {
      dataForm {
        id
        displayName
        dataCollection
        idPrefix
      }
      errors {
        __typename
        ... on Error { message }
      }
    }
  }
`;

const UPDATE_DATA_FORM = `
  mutation UpdateDataForm($input: UpdateDataFormInput!) {
    updateDataForm(input: $input) {
      dataForm { id displayName dataCollection }
      errors {
        __typename
        ... on Error { message }
      }
    }
  }
`;

const GET_DATA_FORM = `
  query GetDataForm($dataCollection: DataCollection!) {
    dataForm(dataCollection: $dataCollection) {
      id
      displayName
      dataCollection
      icon
      color
      allowMultipleTypes
      allowCommenting
      allowInactive
      allowAttachments
      displayFields
      fields {
        __typename
        ... on ValueFieldDefinition {
          key
          label
          required
          valueType
          selectionType
          dataCollection
          searchable
          archived
          comboBoxOptions { value }
          maxDecimals
          requiresManagePermissions
          section
          fieldGroup
          size
          helpText
        }
        ... on GroupFieldDefinition {
          key
          label
          section
          fieldGroup
          size
        }
        ... on DisplayFieldDefinition {
          key
          label
          displayType
          section
          fieldGroup
          size
        }
      }
    }
  }
`;

interface CreatePayload {
  createDataForm: {
    dataForm: {
      id: string;
      displayName: string;
      dataCollection: string;
      idPrefix: string;
    } | null;
    errors: Array<{ __typename: string; message?: string }> | null;
  };
}

interface UpdatePayload {
  updateDataForm: {
    dataForm: { id: string; displayName: string; dataCollection: string } | null;
    errors: Array<{ __typename: string; message?: string }> | null;
  };
}

type ExistingField =
  | {
      __typename: "ValueFieldDefinition";
      key: string;
      label: string;
      required: boolean;
      valueType: string;
      selectionType: string;
      dataCollection?: string | null;
      searchable: boolean;
      archived: boolean;
      comboBoxOptions?: Array<{ value: string }> | null;
      maxDecimals?: number | null;
      requiresManagePermissions: boolean;
      section: string;
      fieldGroup?: string | null;
      size: string;
      helpText?: string | null;
    }
  | {
      __typename: "GroupFieldDefinition";
      key: string;
      label: string;
      section: string;
      fieldGroup?: string | null;
      size: string;
    }
  | {
      __typename: "DisplayFieldDefinition";
      key: string;
      label: string;
      displayType: string;
      section: string;
      fieldGroup?: string | null;
      size: string;
    };

interface ExistingForm {
  id: string;
  displayName: string;
  dataCollection: string;
  icon?: string | null;
  color: string;
  allowMultipleTypes: boolean;
  allowCommenting: boolean;
  allowInactive: boolean;
  allowAttachments: boolean;
  displayFields: string[];
  fields: ExistingField[];
}

export interface SeedOptions {
  apiUrl: string;
  apiKey: string;
}

export async function seedOkrDataForms(
  options: SeedOptions
): Promise<SeedCollectionResult[]> {
  const results: SeedCollectionResult[] = [];

  for (const definition of OKR_DATA_FORMS) {
    results.push(await upsertDataForm(definition, options));
  }

  return results;
}

async function upsertDataForm(
  definition: DataFormDefinition,
  options: SeedOptions
): Promise<SeedCollectionResult> {
  try {
    const data = await consolidateGraphql<CreatePayload>(
      CREATE_DATA_FORM,
      { input: toCreateDataFormInput(definition) },
      options
    );

    const payload = data.createDataForm;
    const errors = payload.errors ?? [];

    if (errors.some((e) => e.__typename === "DataCollectionAlreadyExistsError")) {
      return syncExistingForm(definition, options, "exists");
    }

    if (errors.length > 0) {
      return {
        dataCollection: definition.dataCollection,
        status: "failed",
        message: errors.map((e) => e.message ?? e.__typename).join("; "),
      };
    }

    if (!payload.dataForm) {
      return {
        dataCollection: definition.dataCollection,
        status: "failed",
        message: "Keine DataForm-Antwort von Consolidate",
      };
    }

    // Ensure desired fields even after create (defensive)
    const synced = await syncExistingForm(definition, options, "created");
    return {
      ...synced,
      status: synced.status === "failed" ? "failed" : "created",
      dataFormId: payload.dataForm.id,
      message:
        synced.status === "failed"
          ? synced.message
          : `${payload.dataForm.displayName} (${payload.dataForm.idPrefix})`,
    };
  } catch (error) {
    const message =
      error instanceof ConsolidateApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unbekannter Fehler";

    if (/already exists|bereits vorhanden/i.test(message)) {
      return syncExistingForm(definition, options, "exists");
    }

    return {
      dataCollection: definition.dataCollection,
      status: "failed",
      message,
    };
  }
}

async function syncExistingForm(
  definition: DataFormDefinition,
  options: SeedOptions,
  baseStatus: "created" | "exists"
): Promise<SeedCollectionResult> {
  try {
    const { dataForm } = await consolidateGraphql<{ dataForm: ExistingForm | null }>(
      GET_DATA_FORM,
      { dataCollection: definition.dataCollection },
      options
    );

    if (!dataForm) {
      return {
        dataCollection: definition.dataCollection,
        status: "failed",
        message: "Datensammlung existiert laut API, Formular nicht lesbar",
      };
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
      return {
        dataCollection: definition.dataCollection,
        status: baseStatus,
        dataFormId: dataForm.id,
        message:
          baseStatus === "exists"
            ? "Datensammlung war bereits vorhanden (Felder OK)"
            : undefined,
      };
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
        .map(existingFieldToInput),
      ...missing.map((f) => valueFieldInput(f)),
    ];

    const displayFields = definition.displayFields.filter((key) =>
      fields.some(
        (f) =>
          "value" in f &&
          (f as { value: { key: string } }).value.key === key
      )
    );

    const update = await consolidateGraphql<UpdatePayload>(
      UPDATE_DATA_FORM,
      {
        input: {
          id: dataForm.id,
          displayName: definition.displayName,
          color: definition.color,
          icon: definition.icon,
          allowMultipleTypes: definition.allowMultipleTypes ?? false,
          allowCommenting: definition.allowCommenting,
          allowInactive: definition.allowInactive ?? true,
          allowAttachments: definition.allowAttachments,
          displayFields:
            displayFields.length > 0 ? displayFields : dataForm.displayFields,
          fields,
        },
      },
      options
    );

    const updateErrors = update.updateDataForm.errors ?? [];
    if (updateErrors.length > 0 || !update.updateDataForm.dataForm) {
      return {
        dataCollection: definition.dataCollection,
        status: "failed",
        dataFormId: dataForm.id,
        message: `Sync fehlgeschlagen: ${
          updateErrors.map((e) => e.message ?? e.__typename).join("; ") ||
          "keine Antwort"
        }`,
      };
    }

    return {
      dataCollection: definition.dataCollection,
      status: baseStatus,
      dataFormId: dataForm.id,
      message: `Felder synchronisiert (+${missing.map((m) => m.key).join(", ") || "placeholder cleanup"})`,
    };
  } catch (error) {
    return {
      dataCollection: definition.dataCollection,
      status: "failed",
      message:
        error instanceof Error ? error.message : "Sync der Felder fehlgeschlagen",
    };
  }
}

function existingFieldToInput(field: ExistingField) {
  if (field.__typename === "ValueFieldDefinition") {
    return valueFieldInput({
      key: field.key,
      label: field.label,
      required: field.required,
      valueType: field.valueType as ValueFieldDef["valueType"],
      selectionType: field.selectionType as ValueFieldDef["selectionType"],
      dataCollection: field.dataCollection ?? undefined,
      searchable: field.searchable,
      section: field.section as ValueFieldDef["section"],
      size: field.size as ValueFieldDef["size"],
      helpText: field.helpText ?? undefined,
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
