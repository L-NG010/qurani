<?php

namespace App\Http\Controllers\Qurani;

use App\Http\Controllers\Controller;
use App\Models\Qurani\Chapter;
use App\Models\Qurani\Verses;
use App\Models\Qurani\Word;
use App\Traits\FetchWords;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChapterController extends Controller
{
    use FetchWords;

    public function show($id, Request $request)
    {
        if ($id < 1 || $id > 114) {
            abort(404, 'Surah tidak ditemukan');
        }

        // Determine font type from request (default to uthmani)
        $fontType = $request->query('font_type', 'uthmani'); // 'uthmani' or 'indopak'
        if (!in_array($fontType, ['uthmani', 'indopak'])) {
            $fontType = 'uthmani'; // Fallback to uthmani if invalid
        }

        $surah = Chapter::findOrFail($id, [
            'id',
            'revelation_place',
            'bismillah_pre',
            'name_simple',
            'name_arabic',
            'verses_count',
            'translated_name'
        ]);

        $verses = Verses::where('verse_key', 'like', $id . ':%')
            ->orderBy('verse_number')
            ->select([
                'id',
                'verse_number',
                'verse_key',
                'text_uthmani',
                'text_indopak',
                'page_number',
                'juz_number'
            ])
            ->get();

        if ($verses->isNotEmpty()) {
            $verseKeys = $verses->pluck('verse_key')->toArray();
            $wordsGroup = $this->fetchWordsForVerses($verseKeys);
            $endMarkers = Word::where(function ($query) use ($verseKeys) {
                foreach ($verseKeys as $key) {
                    $query->orWhere('location', 'like', $key . ':%');
                }
            })
                ->where('char_type_name', 'end')
                ->select(['location', 'text_uthmani', 'text_indopak'])
                ->get()
                ->keyBy(function ($word) {
                    [$surah, $verse] = explode(':', $word->location);
                    return "$surah:$verse";
                });

            $verses->transform(function ($verse) use ($wordsGroup, $endMarkers, $fontType) {
                $verse->words = $wordsGroup->get($verse->verse_key, collect())->map(function ($word) use ($fontType) {
                    return [
                        'id' => $word->id,
                        'position' => $word->position,
                        'text_indopak' => $word->text_indopak,
                        'text_uthmani' => $word->text_uthmani,
                        'char_type_name' => $word->char_type_name,
                        'location' => $word->location
                    ];
                })->filter(function ($word) {
                    return $word['char_type_name'] === 'word';
                })->values();
                $verse->text = $fontType === 'indopak' ? $verse->text_indopak : $verse->text_uthmani;
                $verse->end_marker = $endMarkers->get($verse->verse_key, (object)[
                    'text_uthmani' => '',
                    'text_indopak' => ''
                ])->{$fontType === 'indopak' ? 'text_indopak' : 'text_uthmani'};
                return $verse;
            });
        }

        return Inertia::render('surah/Index', [
            'surah' => [
                'id' => $surah->id,
                'revelation_place' => $surah->revelation_place,
                'bismillah_pre' => $surah->bismillah_pre,
                'name_simple' => $surah->name_simple,
                'name_arabic' => $surah->name_arabic,
                'verses_count' => $surah->verses_count,
                'translated_name' => $surah->translated_name,
                'font_type' => $fontType
            ],
            'verses' => $verses
        ]);
    }
}