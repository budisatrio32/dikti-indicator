"use client";

export const dashboardMenuItems = [
  "Overview",
  "IKU 001",
  "IKU 002",
  "IKU 003",
  "IKU 005",
  "IKU 007",
  "IKU 009",
] as const;

export type DashboardMenuItem = (typeof dashboardMenuItems)[number];
export type MappedDashboardTab = Exclude<DashboardMenuItem, "Overview">;

export type DashboardTabConnection = {
  userEmail: string;
  dashboardTab: string;
  sourceId: string;
  sourceLabel: string;
};

export const overviewDashboardItems = [
  { tab: "IKU 001", title: "Angka Efisiensi Edukasi Perguruan Tinggi" },
  { tab: "IKU 002", title: "Persentase Lulusan Pendidikan Tinggi dan Vokasi yang Langsung Bekerja/Melanjutkan Jenjang Pendidikan Berikutnya/ Berwirausaha dalam Jangka Waktu 1 Tahun Setelah Kelulusan" },
  { tab: "IKU 003", title: "Persentase Mahasiswa S1 dan D4/D3/D2/D1 Berkegiatan/Meraih Prestasi di Luar Program Studi" },
  { tab: "IKU 005", title: "Rasio Luaran Hasil Kerjasama Antara Perguruan Tinggi dan Start-Up/Industri/Lembaga" },
  { tab: "IKU 007", title: "Persentase Keterlibatan Perguruan Tinggi dalam SDG 1 (Tanpa Kemiskinan), SDG 4 (Pendidikan Berkualitas), SDG 17 (Kemitraan), dan 2 (dua) SDGs Lain Sesuai Keunggulan" },
  { tab: "IKU 009", title: "Indikator Tambahan Institusi & Internasionalisasi" },
] as const;

export const ikuDashboardDetails: Record<MappedDashboardTab, { title: string; description: string }> = {
  "IKU 001": {
    title: "Angka Efisiensi Edukasi Perguruan Tinggi",
    description:
      "Mengukur angka efisiensi edukasi berdasarkan perbandingan persentase kelulusan tepat waktu mahasiswa dengan jumlah mahasiswa masuk sesuai jenjang studi di perguruan tinggi.",
  },
  "IKU 002": {
    title: "Persentase Lulusan Pendidikan Tinggi dan Vokasi yang Langsung Bekerja/Melanjutkan Jenjang Pendidikan Berikutnya/ Berwirausaha dalam Jangka Waktu 1 Tahun Setelah Kelulusan",
    description:
      "Mengukur persentase mahasiswa jenjang diploma dan sarjana yang berhasil mendapatkan pekerjaan layak dengan pendapatan di atas UMR, melanjutkan studi ke jenjang yang lebih tinggi, atau berwirausaha secara mandiri dalam waktu 12 bulan setelah kelulusan.",
  },
  "IKU 003": {
    title: "Persentase Mahasiswa S1 dan D4/D3/D2/D1 Berkegiatan/Meraih Prestasi di Luar Program Studi",
    description:
      "Mengukur persentase mahasiswa aktif yang menghabiskan minimal 20 SKS di luar prodi asal melalui program MBKM seperti magang industri, proyek desa, wirausaha, mengajar di sekolah, pertukaran pelajar, penelitian, atau berprestasi di tingkat nasional/internasional.",
  },
  "IKU 005": {
    title: "Rasio Luaran Hasil Kerjasama Antara Perguruan Tinggi dan Start-Up/Industri/Lembaga",
    description:
      "Mengukur persentase atau rasio produk/luaran hasil kerjasama penelitian, pengembangan, atau pengabdian masyarakat antara perguruan tinggi dengan start-up, industri, atau lembaga mitra strategis.",
  },
  "IKU 007": {
    title: "Persentase Keterlibatan Perguruan Tinggi dalam SDG 1 (Tanpa Kemiskinan), SDG 4 (Pendidikan Berkualitas), SDG 17 (Kemitraan), dan 2 (dua) SDGs Lain Sesuai Keunggulan",
    description:
      "Mengukur persentase keterlibatan dan kontribusi aktif perguruan tinggi dalam program pembangunan berkelanjutan (SDGs), khususnya SDG 1 (Tanpa Kemiskinan), SDG 4 (Pendidikan Berkualitas), SDG 17 (Kemitraan), serta 2 SDGs pilihan lain yang relevan dengan keunggulan institusi.",
  },
  "IKU 009": {
    title: "Kategori Tambahan & Internasionalisasi Institusi",
    description:
      "Mengukur akreditasi internasional program studi, tingkat keaktifan kemitraan global universitas, serta penjaminan mutu tata kelola lembaga pendidikan tinggi berbasis standar global terintegrasi.",
  },
};
