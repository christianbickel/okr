import "server-only";

import type { DriveDocument, DrivePreviewType } from "@/lib/okr/types";
import { consolidateGraphql } from "./client";
import { readInstanceConfig } from "./config";
import {
  consolidateAttachmentViewUrl,
  consolidateEntryUrl,
} from "./urls";

interface TaskAttachmentNode {
  id: string;
  name: string;
  size: number;
  contentType?: string | null;
  previewType: DrivePreviewType;
  created?: string | null;
  lastModified?: string | null;
}

interface TaskNode {
  id: string;
  displayName: string;
  attachmentsCount: number;
  dataTypes: Array<{
    key: string;
    displayName: string;
    color?: string | null;
  }>;
  values: {
    subject?: string | null;
    status?: { name: string; category?: string | null } | null;
    responsible?: { id: string; displayName: string } | null;
    project?: { id: string; displayName: string; databaseId?: string | null } | null;
  };
  attachments: TaskAttachmentNode[];
}

const LIST_TASKS_WITH_ATTACHMENTS = `
  query DriveTasksWithAttachments($take: Int!, $skip: Int!) {
    dataEntries_Task(take: $take, skip: $skip) {
      totalCount
      pageInfo { hasNextPage }
      items {
        id
        displayName
        attachmentsCount
        dataTypes { key displayName color }
        values {
          subject
          status { name category }
          responsible { id displayName }
          project { id displayName databaseId }
        }
        attachments {
          id
          name
          size
          contentType
          previewType
          created
          lastModified
        }
      }
    }
  }
`;

function mapDocument(
  task: TaskNode,
  attachment: TaskAttachmentNode,
  apiUrl: string | undefined
): DriveDocument {
  const taskType = task.dataTypes[0];
  return {
    id: attachment.id,
    name: attachment.name,
    size: Number(attachment.size) || 0,
    contentType: attachment.contentType ?? undefined,
    previewType: attachment.previewType ?? "Other",
    createdAt: attachment.created ?? undefined,
    modifiedAt: attachment.lastModified ?? attachment.created ?? undefined,
    thumbnailUrl: `/api/drive/thumbnail?id=${encodeURIComponent(attachment.id)}`,
    openUrl: apiUrl
      ? consolidateAttachmentViewUrl(apiUrl, attachment.id)
      : "#",
    task: {
      id: task.id,
      name: task.values.subject?.trim() || task.displayName,
      url: apiUrl ? consolidateEntryUrl(apiUrl, task.id) : undefined,
      status: task.values.status?.name
        ? {
            name: task.values.status.name,
            category: task.values.status.category ?? undefined,
          }
        : undefined,
    },
    project: task.values.project
      ? {
          id: task.values.project.id,
          name:
            task.values.project.displayName ||
            task.values.project.databaseId ||
            "Projekt",
        }
      : undefined,
    responsible: task.values.responsible
      ? {
          id: task.values.responsible.id,
          name: task.values.responsible.displayName,
        }
      : undefined,
    taskType: taskType
      ? {
          key: taskType.key,
          name: taskType.displayName || taskType.key,
          color: taskType.color ?? undefined,
        }
      : undefined,
  };
}

/**
 * Collect Task attachments visible to the current Consolidate session.
 * Paginates through tasks server-side (capped) and flattens to Drive documents.
 */
export async function listDriveDocuments(options?: {
  maxTasks?: number;
  pageSize?: number;
}): Promise<{ documents: DriveDocument[]; scannedTasks: number; truncated: boolean }> {
  const apiUrl = (await readInstanceConfig())?.apiUrl;
  const pageSize = options?.pageSize ?? 100;
  const maxTasks = options?.maxTasks ?? 1000;
  const documents: DriveDocument[] = [];
  let skip = 0;
  let scannedTasks = 0;
  let truncated = false;

  while (scannedTasks < maxTasks) {
    const take = Math.min(pageSize, maxTasks - scannedTasks);
    const data = await consolidateGraphql<{
      dataEntries_Task: {
        totalCount: number;
        pageInfo: { hasNextPage: boolean };
        items: TaskNode[];
      };
    }>(LIST_TASKS_WITH_ATTACHMENTS, {
      take,
      skip,
    });

    const items = data.dataEntries_Task.items ?? [];
    scannedTasks += items.length;

    for (const task of items) {
      if (!task.attachments?.length) continue;
      for (const attachment of task.attachments) {
        documents.push(mapDocument(task, attachment, apiUrl));
      }
    }

    if (!data.dataEntries_Task.pageInfo.hasNextPage || items.length === 0) {
      break;
    }
    if (scannedTasks >= maxTasks) {
      truncated = true;
      break;
    }
    skip += take;
  }

  return { documents, scannedTasks, truncated };
}
