import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'job-descriptions';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];

export interface UploadedFileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
}

function validateFile(file: File): void {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error('Invalid file type. Please upload a PDF, Word document, text file, or image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }
}

function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${timestamp}_${sanitizedFileName}`;
}

export async function uploadJobDescription(file: File): Promise<UploadedFileInfo> {
  validateFile(file);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const filePath = generateFilePath(user.id, file.name);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return {
    path: data.path,
    name: file.name,
    size: file.size,
    type: file.type
  };
}

export async function getJobDescriptionUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600);

  if (error) {
    throw new Error(`Failed to get download URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return data.signedUrl;
}

export async function deleteJobDescription(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

export async function replaceJobDescription(
  oldFilePath: string,
  newFile: File
): Promise<UploadedFileInfo> {
  await deleteJobDescription(oldFilePath);
  return await uploadJobDescription(newFile);
}
