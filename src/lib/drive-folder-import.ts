import "server-only";

import { getContentType, getMediaType } from "@/lib/audio-files";
import { getDrive } from "@/lib/google-drive";
import { syncMixMetadata } from "@/lib/mix-metadata";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { MixMediaType, MixRecord } from "@/types/mix";
import type { Database } from "@/types/supabase";

type MixInsert = Database["public"]["Tables"]["mixes"]["Insert"];
type SupabaseErrorLike = { message: string } | null;
type SupabaseManyResult<T> = {
  data: T[] | null;
  error: SupabaseErrorLike;
};
type MixesImportInsertBuilder = {
  select: (columns: "*") => PromiseLike<SupabaseManyResult<MixRecord>>;
};
type MixesImportTableClient = {
  select: (
    columns: "drive_file_id, slug, media_type",
  ) => PromiseLike<SupabaseManyResult<ExistingMixIdentity>>;
  insert: (values: MixInsert[]) => MixesImportInsertBuilder;
};

type DriveFolderFile = {
  fileId: string;
  fileName: string;
  mimeType: string;
  modifiedTime: string | null;
};

type DriveFolderSource = {
  folderId: string;
};

type ExistingMixIdentity = Pick<
  MixRecord,
  "drive_file_id" | "slug" | "media_type"
>;

type ImportedMixSummary = {
  id: string;
  title: string;
  slug: string | null;
  driveFileId: string;
  mediaType: MixMediaType | null;
  metadataStatus: MixRecord["metadata_status"];
};

export type DriveFolderImportResult = {
  folderId: string | null;
  videoFolderId: string | null;
  scannedFolders: number;
  scannedFiles: number;
  supportedMediaFiles: number;
  supportedAudioFiles: number;
  supportedVideoFiles: number;
  insertedMixes: ImportedMixSummary[];
  skippedExisting: number;
  skippedUnsupported: number;
  metadataSynced: number;
  metadataFailed: Array<{
    mixId: string;
    title: string;
    error: string | null;
  }>;
  publishImported: boolean;
  syncMetadata: boolean;
};

const DRIVE_FOLDER_FIELDS = "nextPageToken, files(id, name, mimeType, modifiedTime)";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const stripFileExtension = (fileName: string) =>
  fileName.replace(/\.[^./\\]+$/, "");

const normalizeTitleFromFileName = (fileName: string) => {
  const title = collapseWhitespace(stripFileExtension(fileName).replace(/_/g, " "));
  return title || "Untitled Mix";
};

const normalizeSlugSegment = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\u2019/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getReservedSlugsForMediaType = (
  reservedSlugsByMediaType: Map<MixMediaType, Set<string>>,
  mediaType: MixMediaType,
) => {
  const reservedSlugs = reservedSlugsByMediaType.get(mediaType) ?? new Set();
  reservedSlugsByMediaType.set(mediaType, reservedSlugs);
  return reservedSlugs;
};

const createUniqueSlug = (title: string, reservedSlugs: Set<string>) => {
  const baseSlug = normalizeSlugSegment(title) || "mix";

  if (!reservedSlugs.has(baseSlug)) {
    reservedSlugs.add(baseSlug);
    return baseSlug;
  }

  let suffix = 2;

  while (reservedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  const slug = `${baseSlug}-${suffix}`;
  reservedSlugs.add(slug);
  return slug;
};

const getConfiguredDriveFolderIds = ({
  folderIdOverride,
  videoFolderIdOverride,
}: {
  folderIdOverride?: string | null;
  videoFolderIdOverride?: string | null;
}) => {
  const folderId =
    folderIdOverride?.trim() ||
    process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID?.trim() ||
    process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID?.trim() ||
    process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
    "";
  const videoFolderId =
    videoFolderIdOverride?.trim() ||
    process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID?.trim() ||
    "";

  if (!folderId && !videoFolderId) {
    throw new Error(
      "No Drive media folder is configured. Set GOOGLE_DRIVE_MEDIA_FOLDER_ID, GOOGLE_DRIVE_AUDIO_FOLDER_ID, GOOGLE_DRIVE_VIDEO_FOLDER_ID, or GOOGLE_DRIVE_FOLDER_ID, or enter a folder ID in the admin form.",
    );
  }

  return {
    folderId: folderId || null,
    videoFolderId: videoFolderId || null,
  };
};

const getUniqueDriveFolderSources = ({
  folderId,
  videoFolderId,
}: {
  folderId: string | null;
  videoFolderId: string | null;
}) => {
  const seenFolderIds = new Set<string>();
  const folderSources: DriveFolderSource[] = [];

  for (const candidateFolderId of [folderId, videoFolderId]) {
    if (!candidateFolderId || seenFolderIds.has(candidateFolderId)) {
      continue;
    }

    seenFolderIds.add(candidateFolderId);
    folderSources.push({ folderId: candidateFolderId });
  }

  return folderSources;
};

const listDriveFolderFiles = async (folderId: string): Promise<DriveFolderFile[]> => {
  const drive = getDrive();
  const files: DriveFolderFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: DRIVE_FOLDER_FIELDS,
      pageSize: 1000,
      pageToken,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      orderBy: "modifiedTime desc, name_natural",
    });

    const pageFiles = response.data.files ?? [];

    for (const file of pageFiles) {
      if (!file.id || !file.name || !file.mimeType) {
        continue;
      }

      files.push({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime || null,
      });
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
};

const getExistingMixIdentities = async (): Promise<ExistingMixIdentity[]> => {
  const mixesTable = getSupabaseAdmin().from(
    "mixes",
  ) as unknown as MixesImportTableClient;
  const { data, error } = await mixesTable.select(
    "drive_file_id, slug, media_type",
  );

  if (error) {
    throw new Error(`Failed to load existing mixes: ${error.message}`);
  }

  return (data ?? []) as ExistingMixIdentity[];
};

export const getDefaultMediaDriveFolderId = () =>
  process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID?.trim() ||
  process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID?.trim() ||
  process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
  "";

export const getDefaultVideoDriveFolderId = () =>
  process.env.GOOGLE_DRIVE_VIDEO_FOLDER_ID?.trim() || "";

export const getDefaultAudioDriveFolderId = getDefaultMediaDriveFolderId;

export const importNewMixesFromDriveFolder = async ({
  folderId: folderIdOverride,
  videoFolderId: videoFolderIdOverride,
  publishImported = true,
  syncMetadata = true,
}: {
  folderId?: string | null;
  videoFolderId?: string | null;
  publishImported?: boolean;
  syncMetadata?: boolean;
}): Promise<DriveFolderImportResult> => {
  const { folderId, videoFolderId } = getConfiguredDriveFolderIds({
    folderIdOverride,
    videoFolderIdOverride,
  });
  const folderSources = getUniqueDriveFolderSources({ folderId, videoFolderId });
  const driveFiles = (
    await Promise.all(
      folderSources.map((folderSource) =>
        listDriveFolderFiles(folderSource.folderId),
      ),
    )
  ).flat();
  const existingMixes = await getExistingMixIdentities();
  const existingDriveFileIds = new Set<string>();
  const reservedSlugsByMediaType = new Map<MixMediaType, Set<string>>();

  for (const mix of existingMixes) {
    if (mix.drive_file_id) {
      existingDriveFileIds.add(mix.drive_file_id);
    }

    if (mix.slug) {
      getReservedSlugsForMediaType(
        reservedSlugsByMediaType,
        mix.media_type ?? "audio",
      ).add(mix.slug);
    }
  }

  const rowsToInsert: MixInsert[] = [];
  let skippedExisting = 0;
  let skippedUnsupported = 0;
  let supportedMediaFiles = 0;
  let supportedAudioFiles = 0;
  let supportedVideoFiles = 0;

  for (const file of driveFiles) {
    const mediaType = getMediaType(file.fileName, file.mimeType);

    if (!mediaType) {
      skippedUnsupported += 1;
      continue;
    }

    supportedMediaFiles += 1;

    if (mediaType === "audio") {
      supportedAudioFiles += 1;
    } else {
      supportedVideoFiles += 1;
    }

    if (existingDriveFileIds.has(file.fileId)) {
      skippedExisting += 1;
      continue;
    }

    existingDriveFileIds.add(file.fileId);
    const title = normalizeTitleFromFileName(file.fileName);
    const reservedSlugs = getReservedSlugsForMediaType(
      reservedSlugsByMediaType,
      mediaType,
    );

    rowsToInsert.push({
      title,
      slug: createUniqueSlug(title, reservedSlugs),
      drive_file_id: file.fileId,
      drive_modified_at: file.modifiedTime,
      media_type: mediaType,
      format: getContentType(file.fileName, file.mimeType),
      published: publishImported,
      metadata_status: "pending",
    });
  }

  if (!rowsToInsert.length) {
    return {
      folderId,
      videoFolderId,
      scannedFolders: folderSources.length,
      scannedFiles: driveFiles.length,
      supportedMediaFiles,
      supportedAudioFiles,
      supportedVideoFiles,
      insertedMixes: [],
      skippedExisting,
      skippedUnsupported,
      metadataSynced: 0,
      metadataFailed: [],
      publishImported,
      syncMetadata,
    };
  }

  const mixesTable = getSupabaseAdmin().from(
    "mixes",
  ) as unknown as MixesImportTableClient;
  const { data: insertedRows, error } = await mixesTable
    .insert(rowsToInsert)
    .select("*");

  if (error) {
    throw new Error(`Failed to insert imported mixes: ${error.message}`);
  }

  const insertedMixes = (insertedRows ?? []) as MixRecord[];
  const metadataFailures: DriveFolderImportResult["metadataFailed"] = [];
  const syncedMixesById = new Map<string, MixRecord>();
  let metadataSynced = 0;

  if (syncMetadata) {
    for (const mix of insertedMixes) {
      const result = await syncMixMetadata(mix);

      if (result.status === "succeeded") {
        metadataSynced += 1;

        if (result.updatedMix) {
          syncedMixesById.set(result.mixId, result.updatedMix);
        }

        continue;
      }

      metadataFailures.push({
        mixId: result.mixId,
        title: mix.title,
        error: result.error,
      });
    }
  }

  return {
    folderId,
    videoFolderId,
    scannedFolders: folderSources.length,
    scannedFiles: driveFiles.length,
    supportedMediaFiles,
    supportedAudioFiles,
    supportedVideoFiles,
    insertedMixes: insertedMixes.map((mix) => {
      const latestMix = syncedMixesById.get(mix.id) ?? mix;

      return {
        id: latestMix.id,
        title: latestMix.title,
        slug: latestMix.slug,
        driveFileId: latestMix.drive_file_id,
        mediaType: latestMix.media_type,
        metadataStatus: latestMix.metadata_status,
      };
    }),
    skippedExisting,
    skippedUnsupported,
    metadataSynced,
    metadataFailed: metadataFailures,
    publishImported,
    syncMetadata,
  };
};
