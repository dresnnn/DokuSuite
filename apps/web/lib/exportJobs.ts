export type ExportJob = {
  id?: string;
  status?: string;
  url?: string;
};

const STORAGE_KEY = 'exportJobs'

const storageKey = (token?: string) =>
  token ? `${STORAGE_KEY}:${token}` : STORAGE_KEY

export const loadExportJobs = (token?: string): ExportJob[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(token))
    return raw ? (JSON.parse(raw) as ExportJob[]) : []
  } catch {
    return []
  }
}

export const saveExportJobs = (jobs: ExportJob[], token?: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(token), JSON.stringify(jobs))
  } catch {
    // ignore write errors
  }
}

export const deleteExportJob = (
  id: string,
  token?: string,
): ExportJob[] => {
  const jobs = loadExportJobs(token).filter((job) => job.id !== id)
  saveExportJobs(jobs, token)
  return jobs
}
