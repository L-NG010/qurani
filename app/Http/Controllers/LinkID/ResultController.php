<?php

namespace App\Http\Controllers\LinkID;

use App\Http\Controllers\Controller;
use App\Models\LinkID\Kota;
use App\Models\LinkID\QuSetoranRekap;
use App\Models\LinkID\QuSetoran;
use App\Models\LinkID\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ResultController extends Controller
{
    public function index()
    {
        return Inertia::render('result/Index');
    }

    public function page(){
        return Inertia::render('result/ResultPageJuz');
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'penyetor' => 'required|string',
            'penerima' => 'required|integer',
            'setoran' => 'required|in:tahsin,tahfidz',
            'tampilan' => 'required|in:surah,juz,page',
            'nomor' => 'required|integer|min:1',
            'info' => 'required|string|max:20',
            'hasil' => 'required|in:Excellent,Very Good,Good,Pass,Weak,Not Pass',
            'ket' => 'nullable|string|max:100',
            'kesalahan' => 'nullable|array',
            'perhalaman' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $penyetor = User::where('user_name', $request->penyetor)->firstOrFail();
            $penerima = $request->penerima;

            $timestamp = Carbon::now()->setTimezone('Asia/Jakarta');

            $setoranData = [
                'tgl' => $timestamp,
                'penyetor' => $penyetor->user_id,
                'penerima' => $penerima,
                'setoran' => $request->setoran,
                'tampilan' => $request->tampilan,
                'nomor' => $request->nomor,
                'info' => $request->info,
                'hasil' => $request->hasil,
                'ket' => $request->ket,
                'kesalahan' => $request->kesalahan ? $request->kesalahan : null,
                'perhalaman' => $request->perhalaman,
                'paraf' => 0,
                'paraftgl' => null,
                'parafoleh' => null,
            ];

            $setoran = QuSetoran::create($setoranData);

            $kota = Kota::find($penyetor->user_city);

            if (!$kota) {
                throw new \Exception('Kota tidak ditemukan untuk penyetor ini.');
            }

            $periode = $timestamp->format('Y-m');
            $day = $timestamp->day;
            $columnDay = 't' . $day;

            $rekap = QuSetoranRekap::where('periode', $periode)
                ->where('kota', $kota->nama)
                ->first();

            if ($rekap) {
                $rekap->$columnDay = ($rekap->$columnDay ?? 0) + 1;
                $rekap->save();
            } else {
                $rekapData = [
                    'periode' => $periode,
                    'negara' => $kota->negara ?? 'Indonesia',
                    'provinsi' => $kota->provinsi ?? null,
                    'kota' => $kota->nama,
                    'lat' => $kota->lat ?? null,
                    'long' => $kota->long ?? null,
                    $columnDay => 1,
                ];

                for ($i = 1; $i <= 31; $i++) {
                    $rekapData['t' . $i] = $rekapData['t' . $i] ?? 0;
                }
                QuSetoranRekap::create($rekapData);
            }

            return response()->json([
                'message' => 'Rekapan setoran berhasil disimpan',
                'data' => [
                    'id' => $setoran->id,
                    'tgl' => $setoran->tgl->toIso8601String(),
                    'penyetor' => $request->penyetor,
                    'penerima' => $request->penerima,
                    'hasil' => $setoran->hasil,
                    'kota' => $kota->nama,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Gagal menyimpan rekapan setoran: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menyimpan rekapan setoran',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
