import { supabase } from '../lib/supabase';
import { uploadJobDescription, deleteJobDescription } from './storageService';

export interface JobDescription {
  id: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateJobDescriptionInput {
  title: string;
  description: string;
  department?: string;
  location?: string;
}

export async function getJobDescriptions(includeInactive = false): Promise<JobDescription[]> {
  let query = supabase
    .from('job_descriptions')
    .select('*')
    .order('title', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getJobDescriptionById(id: string): Promise<JobDescription | null> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createJobDescription(
  input: CreateJobDescriptionInput,
  file?: File
): Promise<JobDescription> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let fileInfo = null;

  if (file) {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `library/${timestamp}_${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-descriptions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    fileInfo = {
      path: uploadData.path,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }

  const jdData = {
    ...input,
    created_by: user.id,
    ...(fileInfo && {
      file_path: fileInfo.path,
      file_name: fileInfo.name,
      file_size: fileInfo.size,
      file_type: fileInfo.type
    })
  };

  const { data, error } = await supabase
    .from('job_descriptions')
    .insert([jdData])
    .select()
    .single();

  if (error) {
    if (fileInfo) {
      await supabase.storage
        .from('job-descriptions')
        .remove([fileInfo.path])
        .catch(() => {});
    }
    throw error;
  }

  return data;
}

export async function updateJobDescription(
  id: string,
  input: Partial<CreateJobDescriptionInput & { is_active: boolean }>,
  file?: File | null,
  removeFile?: boolean
): Promise<JobDescription> {
  const { data: existingJD, error: fetchError } = await supabase
    .from('job_descriptions')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  let fileInfo = null;
  const updateData: any = { ...input };

  if (removeFile && existingJD?.file_path) {
    await supabase.storage
      .from('job-descriptions')
      .remove([existingJD.file_path])
      .catch(() => {});

    updateData.file_path = null;
    updateData.file_name = null;
    updateData.file_size = null;
    updateData.file_type = null;
  } else if (file) {
    if (existingJD?.file_path) {
      await supabase.storage
        .from('job-descriptions')
        .remove([existingJD.file_path])
        .catch(() => {});
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `library/${timestamp}_${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-descriptions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    updateData.file_path = uploadData.path;
    updateData.file_name = file.name;
    updateData.file_size = file.size;
    updateData.file_type = file.type;
  }

  const { data, error } = await supabase
    .from('job_descriptions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJobDescription(id: string): Promise<void> {
  const { data: jd, error: fetchError } = await supabase
    .from('job_descriptions')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  if (jd?.file_path) {
    await supabase.storage
      .from('job-descriptions')
      .remove([jd.file_path])
      .catch(() => {});
  }

  const { error } = await supabase
    .from('job_descriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getJobDescriptionFileUrl(jd: JobDescription): Promise<string | null> {
  if (!jd.file_path) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('job-descriptions')
      .createSignedUrl(jd.file_path, 3600);

    if (error) {
      throw new Error(`Failed to get download URL: ${error.message}`);
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Failed to get file URL:', error);
    return null;
  }
}
