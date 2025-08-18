export type ExportJob = {
  id?: string;
  status?: string;
  url?: string;
};

const STORAGE_KEY = 'exportJobs';

export const loadExportJobs = (): ExportJob[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExportJob[]) : [];
  } catch {
    return [];
  }
};

export const saveExportJobs = (jobs: ExportJob[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // ignore write errors
  }
};

export const deleteExportJob = (id: string): ExportJob[] => {
  const jobs = loadExportJobs().filter((job) => job.id !== id);
  saveExportJobs(jobs);
  return jobs;
};
