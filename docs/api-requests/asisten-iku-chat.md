# Permintaan API — Asisten IKU (Chatbot RAG)

**Untuk:** BE (Rakan) dan AI Ops (Irfan)
**Dari:** FE / AI Engineer
**Status:** `API NOT FOUND`, `SCHEMA NOT FOUND`, `AUTH NOT READY`. UI sudah jadi dan saat ini berjalan dengan data mock (`NEXT_PUBLIC_CHAT_MOCK` ≠ `"false"`).

Kontrak tipe ada di `src/types/chat.ts`. Semua pemanggilan dari UI melewati `src/lib/chat-client.ts`, jadi setelah endpoint tersedia cukup set `NEXT_PUBLIC_CHAT_MOCK=false` tanpa mengubah komponen. Jika bentuk respons perlu diubah, ubah `src/types/chat.ts` terlebih dahulu.

> **Pembaruan (cakupan per halaman):** stakeholder menetapkan bahwa chatbot **hanya menjawab sesuai halaman dasbor yang dibuka**. Di halaman IKU 001, chatbot hanya menjawab seputar IKU 001, begitu pula untuk IKU lain. Halaman Overview hanya menjawab ringkasan lintas IKU dan konsep umum. Aturan ini **wajib ditegakkan di server** (lihat bagian "Aturan cakupan"). Pembatasan di UI/mock hanya simulasi.

Semua error dikembalikan sebagai `{ "error": "<pesan berbahasa Indonesia>" }` dengan status HTTP yang sesuai. Identitas user **wajib** diambil dari sesi server, bukan dari body atau query.

---

## 1. `POST /api/chat` — ajukan pertanyaan (FR-04–FR-09, FR-14, FR-18)

Request:

```json
{
  "conversationId": "opsional; kosong berarti percakapan baru",
  "question": "Hitung capaian AEE PT kami…",
  "scope": { "id": "IKU 001", "kind": "iku", "ikuCode": "IKU 001" }
}
```

- `question`: wajib, setelah di-trim, maksimum 2.000 karakter (UI sudah membatasi).
- `scope`: wajib. Nilainya `{ "id": "overview", "kind": "overview" }` atau `{ "id": "IKU 00x", "kind": "iku", "ikuCode": "IKU 00x" }`. Validasi `ikuCode` terhadap daftar IKU yang dikenal (001, 002, 003, 005, 007, 009).
- `conversationId` harus milik `scope` yang sama. Tolak dengan `400` jika berbeda.

Response `200` (`ChatAnswer`):

```json
{
  "conversationId": "uuid",
  "messageId": "uuid",
  "answer": "Mengacu IKU 1 – Angka Efisiensi Edukasi (AEE), …",
  "blocks": [
    { "type": "metric", "label": "Capaian AEE PT", "value": 86.36, "target": 80, "caption": "Rata-rata dari 5 jenjang" },
    { "type": "formula", "lines": ["Capaian_i = AEE realisasi ÷ AEE ideal × 100%", "AEE PT    = Σ Capaian_i ÷ n"] },
    { "type": "table", "columns": [{ "key": "jenjang", "header": "Jenjang" }], "rows": [{ "jenjang": "D3" }] },
    { "type": "list", "variant": "excluded", "items": ["SPP/UKT/biaya kuliah mahasiswa"] },
    { "type": "note", "text": "Catatan: …" }
  ],
  "citations": [
    {
      "id": "chunk-id",
      "documentTitle": "Buku IKU Diktisaintek Berdampak",
      "documentVersion": "V1",
      "section": "IKU 1 · Formula",
      "page": 45,
      "ikuCode": "IKU 001",
      "snippet": "potongan teks sumber"
    }
  ],
  "grounded": true,
  "confidence": "tinggi",
  "action": { "label": "Buka IKU 001", "dashboardTab": "IKU 001" },
  "outOfScope": null,
  "disclaimer": "Dibuat AI dari Buku IKU V1 & data modul. Periksa sebelum pelaporan."
}
```

- `blocks` bersifat opsional. Blok ini dipakai untuk kartu capaian, formula, tabel, dan daftar seperti di desain Hifi. Semua isinya berupa teks atau angka, **tanpa HTML**.
- `grounded: false` berarti tidak ada konteks relevan (FR-06). UI akan menampilkan peringatan.
- `citations` dibentuk dari metadata chunk yang benar-benar dipakai (FR-07).
- `disclaimer` wajib selalu ada (FR-14).
- `outOfScope` diisi `{ "suggestedTab": "IKU 009" }` (atau `"Overview"`, atau tanpa `suggestedTab`) jika pertanyaan di luar cakupan. Dalam kondisi ini `answer` berisi penolakan singkat, `citations` kosong, dan LLM tidak perlu menyusun jawaban substantif. UI menampilkan tombol "Tanyakan di IKU 009" yang memindahkan pengguna dan mengirim ulang pertanyaan dengan `scope` halaman tersebut.

### Aturan cakupan (wajib di server)

1. **Retrieval difilter berdasarkan metadata chunk.**
   - Cakupan IKU: hanya chunk dengan `ikuCode` = cakupan, ditambah chunk umum yang ditandai relevan untuk semua IKU (mis. definisi istilah) bila tim AI menyetujuinya.
   - Cakupan Overview: chunk umum/kebijakan dan daftar IKU, **bukan** rincian formula per IKU.
2. **Data modul (FR-18) hanya untuk IKU dalam cakupan.** Overview boleh membaca ringkasan status dan target semua IKU.
3. **Deteksi di luar cakupan** dilakukan sebelum generasi: penyebutan IKU lain (mis. "IKU 9"), topik khas IKU lain, atau skor retrieval dalam cakupan di bawah threshold sementara skor di cakupan lain tinggi. Isi `outOfScope.suggestedTab` dengan IKU yang terdeteksi.
4. **System prompt menyebut cakupan secara eksplisit** dan melarang menjawab di luar cakupan, meskipun pengguna memintanya (mitigasi prompt injection).

**Streaming (NFR token pertama ≤ 5 detik), diusulkan sebagai tahap 2:** `text/event-stream` dengan event berikut:
- `status` → `{ "text": "Mencari di Buku IKU · Bab V, IKU 9…" }`
- `token` → `{ "text": "potongan" }`
- `done` → `ChatAnswer` lengkap
- `error` → `{ "error": "…" }`

UI sudah menyediakan callback `onStatus` dan `onToken`. Tombol **Hentikan** membatalkan request lewat `AbortSignal`, jadi server sebaiknya menghentikan pemanggilan LLM saat koneksi ditutup.

## 2. `GET /api/chat/conversations?scope=<id>` — riwayat per halaman (FR-12)

Response `200`:

```json
{ "conversations": [{ "id": "uuid", "scopeId": "IKU 001", "title": "Kalkulasi AEE & definisi IKU 001", "updatedAt": "ISO-8601", "messageCount": 4 }] }
```

Diurutkan dari yang terbaru, hanya berisi milik user yang sedang login, dan hanya untuk `scope` yang diminta.

## 3. `GET /api/chat/conversations/:id` — isi percakapan (FR-09, FR-12)

Response `200`: `{ "messages": ChatMessage[] }`. Lihat bentuknya di `src/types/chat.ts`. Pesan asisten menyertakan `answer` (`ChatAnswer`) dan `feedback`.

## 4. `DELETE /api/chat/conversations/:id` — hapus riwayat (FR-12, retensi UU PDP)

Response `200`: `{ "ok": true }`. Respons `404` dikembalikan jika percakapan bukan milik user.

## 5. `POST /api/chat/messages/:id/feedback` — umpan balik (FR-13)

Request: `{ "value": "up" | "down" | null }` (`null` berarti membatalkan). Response `200`: `{ "ok": true }`.

## 6. (Opsional) `GET /api/knowledge/documents?status=aktif` — versi dokumen aktif

Endpoint ini dipakai untuk tag "Buku IKU V1" pada bagian **Konteks jawaban**, yang saat ini masih statis.

---

## Kebutuhan skema (`SCHEMA NOT FOUND`, PRD §3.4)

- `ChatConversation`: id, userId, **scopeId** (`overview` / `IKU 00x`), title, createdAt, updatedAt
- `DocumentChunk` wajib punya metadata **`ikuCode`** (nullable untuk konten umum) agar retrieval bisa difilter per cakupan
- `ChatMessage`: id, conversationId, role, text, blocks (Json), grounded, confidence, createdAt
- `MessageCitation`: messageId, chunkId, documentVersionId, urutan
- `MessageFeedback`: messageId, userId, value, comment?, createdAt
- `AuditLog`: untuk pertanyaan yang diajukan (FR-17)

## Kebutuhan auth (`AUTH NOT READY`)

Saat ini sesi hanya tersimpan di `localStorage`. Semua endpoint di atas membutuhkan sesi yang diverifikasi server (cookie `httpOnly`) agar riwayat dan feedback tidak bisa dibaca atau dimanipulasi user lain.

## Kebutuhan env (AI Ops)

- `NEXT_PUBLIC_CHAT_MOCK`: `"false"` untuk memakai API asli. Default-nya mock.
- Kredensial LLM/embedding hanya di server (tanpa prefix `NEXT_PUBLIC_`). Nama variabel mengikuti keputusan tim AI.
