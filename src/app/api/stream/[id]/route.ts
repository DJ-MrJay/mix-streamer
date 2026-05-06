import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { getContentType } from "@/lib/audio-files";
import { getDrive } from "@/lib/google-drive";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AudioFileDetails = {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
};

type DriveFileLookupResult = {
  data: { drive_file_id: string } | null;
  error: { message: string } | null;
};

type MixDriveLookupTable = {
  select: (columns: "drive_file_id") => {
    eq: (
      column: "id",
      value: string,
    ) => {
      single: () => PromiseLike<DriveFileLookupResult>;
    };
  };
};

const getContentDisposition = (fileName: string, isDownload: boolean) => {
  const fallbackFileName =
    fileName
      .replace(/[\r\n"]/g, "")
      .replace(/[\\/]/g, "-")
      .trim() || "mix";
  const disposition = isDownload ? "attachment" : "inline";

  return `${disposition}; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(fileName || fallbackFileName)}`;
};

const getAudioFileDetails = async (
  mixId: string,
): Promise<AudioFileDetails | null> => {
  const supabase = getSupabase();
  const drive = getDrive();
  const mixesTable = supabase.from("mixes") as unknown as MixDriveLookupTable;
  const { data: mix, error } = await mixesTable
    .select("drive_file_id")
    .eq("id", mixId)
    .single();

  if (error || !mix) {
    return null;
  }

  const fileMetadata = await drive.files.get({
    fileId: mix.drive_file_id,
    fields: "size, mimeType, name",
  });

  return {
    fileId: mix.drive_file_id,
    fileName: fileMetadata.data.name || "",
    fileSize: Number.parseInt(fileMetadata.data.size || "0", 10),
    contentType: getContentType(
      fileMetadata.data.name || "",
      fileMetadata.data.mimeType || "",
    ),
  };
};

const buildResponseHeaders = ({
  contentType,
  fileSize,
  start,
  end,
  isPartial,
  fileName,
  isDownload,
}: {
  contentType: string;
  fileSize: number;
  start: number;
  end: number;
  isPartial: boolean;
  fileName: string;
  isDownload: boolean;
}) => {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(end - start + 1));
  headers.set(
    "Content-Disposition",
    getContentDisposition(fileName, isDownload),
  );
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");

  if (isPartial) {
    headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
  }

  return headers;
};

const parseRange = (rangeHeader: string | null, fileSize: number) => {
  if (!rangeHeader) {
    return {
      start: 0,
      end: fileSize - 1,
      status: 200,
      isPartial: false,
    };
  }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    return null;
  }

  const [, startValue, endValue] = match;
  let start = startValue ? Number.parseInt(startValue, 10) : Number.NaN;
  let end = endValue ? Number.parseInt(endValue, 10) : fileSize - 1;

  if (!startValue && endValue) {
    const suffixLength = Number.parseInt(endValue, 10);

    if (Number.isNaN(suffixLength) || suffixLength <= 0) {
      return null;
    }

    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  }

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    start >= fileSize
  ) {
    return null;
  }

  end = Math.min(end, fileSize - 1);

  if (end < start) {
    return null;
  }

  return {
    start,
    end,
    status: 206,
    isPartial: true,
  };
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const drive = getDrive();
    const params = await context.params;
    const fileDetails = await getAudioFileDetails(params.id);

    if (!fileDetails) {
      return new Response("Not found", { status: 404 });
    }

    if (fileDetails.fileSize <= 0) {
      return new Response("Stream unavailable", { status: 502 });
    }

    const range = parseRange(req.headers.get("range"), fileDetails.fileSize);
    const isDownload = req.nextUrl.searchParams.get("download") === "1";

    if (!range) {
      return new Response("Requested range not satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileDetails.fileSize}`,
        },
      });
    }

    const headers = buildResponseHeaders({
      contentType: fileDetails.contentType,
      fileSize: fileDetails.fileSize,
      start: range.start,
      end: range.end,
      isPartial: range.isPartial,
      fileName: fileDetails.fileName,
      isDownload,
    });

    const response = await drive.files.get(
      {
        fileId: fileDetails.fileId,
        alt: "media",
      },
      {
        responseType: "stream",
        headers: range.isPartial
          ? { Range: `bytes=${range.start}-${range.end}` }
          : undefined,
      },
    );

    const stream = Readable.toWeb(
      response.data as Readable,
    ) as unknown as BodyInit;

    return new Response(stream, {
      status: range.status,
      headers,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const fileDetails = await getAudioFileDetails(params.id);

    if (!fileDetails) {
      return new Response(null, { status: 404 });
    }

    if (fileDetails.fileSize <= 0) {
      return new Response(null, { status: 502 });
    }

    const range = parseRange(req.headers.get("range"), fileDetails.fileSize);
    const isDownload = req.nextUrl.searchParams.get("download") === "1";

    if (!range) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileDetails.fileSize}`,
        },
      });
    }

    return new Response(null, {
      status: range.status,
      headers: buildResponseHeaders({
        contentType: fileDetails.contentType,
        fileSize: fileDetails.fileSize,
        start: range.start,
        end: range.end,
        isPartial: range.isPartial,
        fileName: fileDetails.fileName,
        isDownload,
      }),
    });
  } catch (error) {
    console.error("Stream head error:", error);
    return new Response(null, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");
  return new Response(null, { status: 204, headers });
}
