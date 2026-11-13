import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import {
  consolidateGraphql,
  fetchConsolidateAsset,
  resolveConsolidateAuth,
} from "@/lib/consolidate/client";
import { ConsolidateApiError } from "@/lib/consolidate/errors";
import {
  resolveConsolidateAssetUrl,
  withThumbnailQuery,
} from "@/lib/consolidate/urls";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  try {
    const data = await consolidateGraphql<{
      attachment: {
        id: string;
        downloadUrl: string;
        contentType?: string | null;
        previewType?: string | null;
      } | null;
    }>(
      `query DriveAttachmentThumbnail($id: ID!) {
        attachment(id: $id) {
          id
          downloadUrl
          contentType
          previewType
        }
      }`,
      { id }
    );

    const attachment = data.attachment;
    if (!attachment?.downloadUrl) {
      return new NextResponse("Not found", { status: 404 });
    }

    const auth = await resolveConsolidateAuth();
    const absolute = resolveConsolidateAssetUrl(
      auth.apiUrl,
      attachment.downloadUrl
    );
    const previewTypesWithThumb = new Set([
      "Image",
      "Pdf",
      "Office",
      "Video",
    ]);
    const useThumb =
      !attachment.previewType ||
      previewTypesWithThumb.has(attachment.previewType);
    const target = useThumb ? withThumbnailQuery(absolute) : absolute;

    const upstream = await fetchConsolidateAsset(target);
    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const contentType =
      upstream.headers.get("content-type") ||
      attachment.contentType ||
      "application/octet-stream";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    if (error instanceof ConsolidateApiError) {
      const status =
        typeof error.status === "number" && error.status >= 400
          ? error.status
          : 502;
      return new NextResponse(error.message, { status });
    }
    return new NextResponse("Thumbnail failed", { status: 500 });
  }
}
