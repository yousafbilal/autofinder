import * as FileSystem from "expo-file-system";
import { getUploadUrl, confirmPhotoMetadata } from "../api/inspections";

export async function uploadInspectionPhoto(params: {
	inspectionId: string;
	localUri: string; // file://
	filename: string;
	contentType: string;
	itemId?: string; // optional; use sectionId if provided
	sectionId?: string; // category key like 'engine'
	lat?: number;
	lon?: number;
	timestamp?: string; // ISO from EXIF if available
}) {
	const { inspectionId, localUri, filename, contentType, itemId, sectionId, lat, lon, timestamp } = params;

	// 1) Get presigned URL
	const presign = await getUploadUrl(inspectionId, { filename, contentType });
	if (!presign.success || !presign.data) throw new Error(presign.message || "Failed to get upload URL");

	// 2) Upload file to storage
	const putRes = await FileSystem.uploadAsync(presign.data.uploadUrl, localUri, {
		uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT as any,
		headers: { "Content-Type": contentType },
	});
	if (putRes.status !== 200) throw new Error(`Upload failed: ${putRes.status}`);

	// 3) Confirm metadata so server can verify EXIF/time/location and compute hash
	const confirm = await confirmPhotoMetadata(inspectionId, {
		url: presign.data.fileUrl,
		itemId: itemId || sectionId || 'general',
		lat,
		lon,
		timestamp,
		providedTimestamp: new Date().toISOString(),
	});
	if (!confirm.success) throw new Error(confirm.message || "Metadata confirm failed");

	return { url: presign.data.fileUrl, sectionId: sectionId || undefined };
}


