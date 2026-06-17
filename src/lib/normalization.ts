import type { CanonicalKey } from "@/types/data";

const aliases: Record<CanonicalKey, string[]> = {
  year: ["tahun", "year"],
  faculty: ["fakultas", "faculty"],
  study_program: ["program studi", "prodi", "study program", "program_studi"],
  degree: ["jenjang", "degree"],
  total_lecturers: ["total dosen tetap", "total_lecturers", "total mahasiswa aktif", "mahasiswa aktif", "total mahasiswa", "total dosen", "total kerjasama", "jumlah kerjasama"],
  iku_017: ["ik-017", "iku 017", "dosen tridharma", "ik017", "mahasiswa berkegiatan di luar prodi", "mahasiswa berkegiatan", "mbkm", "jumlah luaran kerjasama", "luaran kerjasama", "jumlah luaran", "luaran"],
  iku_018: ["ik-018", "iku 018", "dosen praktisi industri", "ik018", "mahasiswa meraih prestasi", "mahasiswa berprestasi", "prestasi mahasiswa", "jumlah kerjasama industri", "kerjasama komersial", "jumlah paten lisensi", "paten lisensi"],
  coaching_achievement: [
    "dosen membina prestasi mahasiswa nasional/internasional",
    "dosen membina prestasi",
    "coaching achievement",
  ],
  iku_total: ["total dosen memenuhi iku003", "iku_total", "total memenuhi iku003", "total mahasiswa memenuhi iku", "mahasiswa memenuhi iku", "total luaran memenuhi iku", "total memenuhi iku005"],
  iku_percentage: ["persentase iku003", "iku percentage", "iku003", "persentase iku", "persentase iku 003", "persentase iku005", "persentase iku 005", "iku005", "rasio luaran"],
  partners: ["mitra kampus/industri", "mitra", "partners", "nama mitra"],
  evidence: ["evidence", "bukti"],
};

export function normalizeColumnName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectCanonicalKey(input: string): CanonicalKey | undefined {
  const normalized = normalizeColumnName(input);
  return (Object.keys(aliases) as CanonicalKey[]).find((key) =>
    aliases[key].some((alias) => normalized.includes(normalizeColumnName(alias))),
  );
}
