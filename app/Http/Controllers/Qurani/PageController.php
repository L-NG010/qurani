<?php

namespace App\Http\Controllers\Qurani;

use App\Http\Controllers\Controller;
use App\Models\Qurani\Chapter;
use App\Models\Qurani\Verses;
use App\Models\Qurani\Word;
use App\Traits\ErrorLabel;
use App\Traits\FetchWords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PageController extends Controller
{
    use FetchWords, ErrorLabel;

    public function show($id, Request $request)
    {
        // Validate Page ID (1–604)
        if ($id < 1 || $id > 604) {
            abort(404, 'Halaman tidak ditemukan');
        }

        // Fetch verses for the page
        $verses = Verses::where('page_number', $id)
            ->orderBy('verse_key')
            ->select([
                'id',
                'verse_number',
                'verse_key',
                'text_uthmani',
                'page_number',
                'juz_number'
            ])
            ->get();

        // Get Surah IDs from verses
        $surahIds = $verses->map(function ($verse) {
            return (int) explode(':', $verse->verse_key)[0];
        })->unique()->values()->toArray();

        // Fetch chapters for the Surahs
        $chapters = Chapter::whereIn('id', $surahIds)
            ->select([
                'id',
                'name_arabic',
                'name_simple',
                'translated_name',
                'bismillah_pre'
            ])
            ->get()
            ->keyBy('id');
        $errorLabels = $this->ErrorLabelGenerate(Auth::user());
        // Fetch words and end markers
        if ($verses->isNotEmpty()) {
            $verseKeys = $verses->pluck('verse_key')->toArray();
            $wordsGroup = $this->fetchWordsForVerses($verseKeys);
            $endMarkers = Word::where(function ($query) use ($verseKeys) {
                foreach ($verseKeys as $key) {
                    $query->orWhere('location', 'like', $key . ':%');
                }
            })
                ->where('char_type_name', 'end')
                ->select(['location', 'text_uthmani'])
                ->get()
                ->keyBy(function ($word) {
                    [$surah, $verse] = explode(':', $word->location);
                    return "$surah:$verse";
                });

            $verses->transform(function ($verse) use ($wordsGroup, $endMarkers) {
                $verse->words = $wordsGroup->get($verse->verse_key, collect())->map(function ($word) {
                    return [
                        'id' => $word->id,
                        'position' => $word->position,
                        'text_uthmani' => $word->text_uthmani,
                        'char_type_name' => $word->char_type_name
                    ];
                })->filter(function ($word) {
                    return $word['char_type_name'] === 'word';
                })->values();
                $verse->end_marker = $endMarkers->get($verse->verse_key, (object) ['text_uthmani' => ''])->text_uthmani;
                return $verse;
            });
        }

        Log::info($verses->toArray());

        // Render the Inertia view
        return Inertia::render('page/Index', [
            'page' => [
                'page_number' => (int) $id
            ],
            'verses' => $verses,
            'chapters' => $chapters,
            "errorLabels" => $errorLabels
        ]);
    }
}
