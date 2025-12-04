import { parseWord } from './fileParserService';

export interface JobDescriptionFile {
  title: string;
  content: string;
  fileName: string;
  filePath: string;
}

const JD_FILES = [
  'JD - Architecture Specialist.docx',
  'JD - DGM, CPS (Format).docx',
  'JD - DGM, Digital.docx',
  'JD - Director, Growth & Supply Chain.docx',
  'JD - GM, CPS (Format).docx'
];

function extractTitleFromFileName(fileName: string): string {
  return fileName
    .replace(/^JD - /, '')
    .replace(/\.docx$/, '')
    .replace(/ \(Format\)/, '')
    .trim();
}

export async function loadJobDescriptionFiles(): Promise<JobDescriptionFile[]> {
  const jobDescriptions: JobDescriptionFile[] = [];

  console.log('Loading job description files...');

  for (const fileName of JD_FILES) {
    try {
      const filePath = `/job-descriptions/${fileName}`;
      console.log(`Attempting to load: ${filePath}`);

      const response = await fetch(filePath);

      if (!response.ok) {
        console.warn(`Could not load ${fileName}: ${response.status} - ${response.statusText}`);
        continue;
      }

      console.log(`Successfully fetched ${fileName}, parsing content...`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const content = await parseWord(file);
      console.log(`Parsed ${fileName}, content length: ${content.length}`);

      if (content && content.length > 50) {
        jobDescriptions.push({
          title: extractTitleFromFileName(fileName),
          content: content,
          fileName: fileName,
          filePath: filePath
        });
        console.log(`Added ${fileName} to job descriptions`);
      } else {
        console.warn(`Content too short for ${fileName}: ${content.length} characters`);
      }
    } catch (error) {
      console.error(`Error parsing ${fileName}:`, error);
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
      }
    }
  }

  console.log(`Loaded ${jobDescriptions.length} job descriptions total`);
  return jobDescriptions;
}

export async function getJobDescriptionContent(fileName: string): Promise<string | null> {
  try {
    const filePath = `/job-descriptions/${fileName}`;
    const response = await fetch(filePath);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    return await parseWord(file);
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error);
    return null;
  }
}
