import "server-only";

import { getDrive } from "@/lib/google-drive";
import { syncMixMetadata } from "@/lib/mix-metadata";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { MixRecord } from "@/types/mix";
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
    columns: "drive_file_id, slug",
  ) => PromiseLike<SupabaseManyResult<ExistingMixIdentity>>;
  insert: (values: MixInsert[]) => MixesImportInsertBuilder;
};

type DriveFolderFile = {
  fileId: string;
  fileName: string;
  mimeType: string;
  modifiedTime: string | null;
};

type ExistingMixIdentity = Pick<MixRecord, "drive_file_id" | "slug">;

type ImportedMixSummary = {
  id: string;
  title: string;
  slug: string | null;
  driveFileId: string;
  metadataStatus: MixRecord["metadata_status"];
};

export type DriveFolderImportResult = {
  folderId: string;
  scannedFiles: number;
  supportedAudioFiles: number;
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

const SUPPORTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".aac",
  ".wav",
  ".ogg",
  ".flac",
] as const;

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

const isSupportedAudioFile = ({
  fileName,
  mimeType,
}: Pick<DriveFolderFile, "fileName" | "mimeType">) => {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.startsWith("audio/")) {
    return true;
  }

  const normalizedName = fileName.toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
};

const getConfiguredAudioFolderId = (overrideFolderId?: string | null) => {
  const folderId =
    overrideFolderId?.trim() ||
    process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID?.trim() ||
    process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
    "";

  if (!folderId) {
    throw new Error(
      "No audio Drive folder is configured. Set GOOGLE_DRIVE_AUDIO_FOLDER_ID or GOOGLE_DRIVE_FOLDER_ID, or enter a folder ID in the admin form.",
    );
  }

  return folderId;
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
  const { data, error } = await mixesTable.select("drive_file_id, slug");

  if (error) {
    throw new Error(`Failed to load existing mixes: ${error.message}`);
  }

  return (data ?? []) as ExistingMixIdentity[];
};

export const getDefaultAudioDriveFolderId = () =>
  process.env.GOOGLE_DRIVE_AUDIO_FOLDER_ID?.trim() ||
  process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
  "";

export const importNewMixesFromDriveFolder = async ({
  folderId: folderIdOverride,
  publishImported = true,
  syncMetadata = true,
}: {
  folderId?: string | null;
  publishImported?: boolean;
  syncMetadata?: boolean;
}): Promise<DriveFolderImportResult> => {
  const folderId = getConfiguredAudioFolderId(folderIdOverride);
  const driveFiles = await listDriveFolderFiles(folderId);
  const existingMixes = await getExistingMixIdentities();
  const existingDriveFileIds = new Set<string>();
  const reservedSlugs = new Set<string>();

  for (const mix of existingMixes) {
    if (mix.drive_file_id) {
      existingDriveFileIds.add(mix.drive_file_id);
    }

    if (mix.slug) {
      reservedSlugs.add(mix.slug);
    }
  }

  const rowsToInsert: MixInsert[] = [];
  let skippedExisting = 0;
  let skippedUnsupported = 0;
  let supportedAudioFiles = 0;

  for (const file of driveFiles) {
    if (!isSupportedAudioFile(file)) {
      skippedUnsupported += 1;
      continue;
    }

    supportedAudioFiles += 1;

    if (existingDriveFileIds.has(file.fileId)) {
      skippedExisting += 1;
      continue;
    }

    existingDriveFileIds.add(file.fileId);
    const title = normalizeTitleFromFileName(file.fileName);

    rowsToInsert.push({
      title,
      slug: createUniqueSlug(title, reservedSlugs),
      drive_file_id: file.fileId,
      drive_modified_at: file.modifiedTime,
      published: publishImported,
      metadata_status: "pending",
    });
  }

  if (!rowsToInsert.length) {
    return {
      folderId,
      scannedFiles: driveFiles.length,
      supportedAudioFiles,
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
    scannedFiles: driveFiles.length,
    supportedAudioFiles,
    insertedMixes: insertedMixes.map((mix) => {
      const latestMix = syncedMixesById.get(mix.id) ?? mix;

      return {
        id: latestMix.id,
        title: latestMix.title,
        slug: latestMix.slug,
        driveFileId: latestMix.drive_file_id,
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
