import AppWrapper from '@/components/layouts/app-wrapper';
import QuranHeader from '@/components/layouts/main-header';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import MistakeModal from '../../components/layouts/mistakeModal';

interface Word {
    id: number;
    position: number;
    text_uthmani: string;
    text_indopak: string;
    char_type_name: string;
    location: string;
}

interface Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    text_: string;
    page_number: number;
    juz_number: number;
    end_marker: string;
    words: Word[];
}

interface ErrorLabel {
    id: number;
    key: string;
    value: string;
    color: string;
    status: number;
}

interface Surah {
    id: number;
    revelation_place: string;
    bismillah_pre: boolean | null;
    name_simple: string;
    name_arabic: string;
    verses_count: number;
    translated_name: { name: string; language_name: string };
}

interface PageProps {
    surah: Surah;
    verses: Verse[];
    errorLabels: {
        user: ErrorLabel[];
        grup: {
            [key: number]: ErrorLabel[];
        };
    };
    [key: string]: unknown;
}

type ErrorsByPage = {
    [page: string]: {
        salahAyat: Array<{
            salahKey: string;
            NamaSurat: string;
            noAyat: number;
            salah: string;
        }>;
        salahKata: Array<{
            salahKey: string;
            kata: { text: string };
            word_location: string;
            salah: string;
        }>;
    };
};

export default function SurahIndex() {
    const { props } = usePage<PageProps>();
    // Pastikan errorLabels memiliki nilai default yang sesuai dengan tipe barunya
    const { surah, verses, errorLabels } = props || { surah: null, verses: [], errorLabels: { user: [], grup: [] } };
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
    const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
    const [selectedWordText, setSelectedWordText] = useState<string | null>(null);
    const [penyetor, setPenyetor] = useState<string>('');
    const [selectedGrup, setSelectedGroup] = useState<number>(0);
    const [wordErrors, setWordErrors] = useState<{ [key: number]: string }>({});
    const [verseErrors, setVerseErrors] = useState<{ [key: number]: string }>({});
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Periksa apakah errorLabels juga tersedia
        if (!surah || !verses || !errorLabels) {
            console.error('Data surah, verses, atau errorLabels tidak tersedia dari server.');
            return;
        }

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const savedWordErrors = localStorage.getItem('wordErrors');
        const savedVerseErrors = localStorage.getItem('verseErrors');
        if (savedWordErrors) setWordErrors(JSON.parse(savedWordErrors));
        if (savedVerseErrors) setVerseErrors(JSON.parse(savedVerseErrors));

        // const initialDarkMode = savedThemeLocal === 'dark' || (!savedThemeLocal && prefersDark);
        // setIsDarkMode(initialDarkMode);
        // if (initialDarkMode) {
        //     document.documentElement.classList.add('dark');
        //     setCookie('s_night_mode', '1', 30);
        // } else {
        //     document.documentElement.classList.remove('dark');
        //     setCookie('s_night_mode', '0', 30);
        // }
    }, [errorLabels]); // Tambahkan errorLabels sebagai dependency agar useEffect ini berjalan saat errorLabels tersedia

    const setCookie = (name: string, value: string, days: number) => {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    };

    useEffect(() => {
        if (!surah || !verses) return;

        if (verses.length === 0) {
            setModalOpen(true);
        }
    }, [verses, surah]); // Tambahkan surah ke dependency

    useEffect(() => {
        if (!surah || !verses || !errorLabels) return; // Pastikan errorLabels juga tersedia

        const errorsByPage = generateErrorsByPage();
        const existingData = localStorage.getItem('setoran-data');

        const startVerse = verses.length > 0 ? verses[0].verse_number : 1;
        const endVerse = verses.length > 0 ? verses[verses.length - 1].verse_number : surah.verses_count;

        // const pageNumber = verses.length > 0 ? verses[0].page_number : 1; // Variabel ini tidak digunakan
        const surahDetails = [
            {
                id: surah.id.toString(),
                name: surah.name_simple,
                first_verse: startVerse.toString(),
                last_verse: endVerse.toString(),
            },
        ];

        let dataToSave = {
            reciter: { id: '12345', full_name: 'Ahmad Ridwan bin Abdullah' },
            setoran_type: 'tahsin',
            display: 'surat',
            surah: surahDetails,
            mistake: errorsByPage,
        };

        if (existingData) {
            const parsedData = JSON.parse(existingData);
            // Pastikan parsedData.penyetor adalah string sebelum diset
            if (typeof parsedData.penyetor === 'string') {
                setPenyetor(parsedData.penyetor);
                setSelectedGroup(parseInt(parsedData.selectedGroup, 10));
            }
            dataToSave = { ...parsedData, surah: dataToSave.surah, mistake: errorsByPage };
        }

        localStorage.setItem('setoran-data', JSON.stringify(dataToSave));
    }, [wordErrors, verseErrors, surah, verses, errorLabels]); // Tambahkan errorLabels ke dependency

    useEffect(() => {
        localStorage.setItem('wordErrors', JSON.stringify(wordErrors));
        localStorage.setItem('verseErrors', JSON.stringify(verseErrors));
    }, [wordErrors, verseErrors]);

    const handleClick = (type: 'word' | 'verse', id: number) => {
        if (type === 'word') {
            setSelectedWordId(id);
            setSelectedVerseId(null);
            const word = verses.flatMap((v) => v.words).find((w) => w.id === id);
            setSelectedWordText(word ? word.text_uthmani : null);
        } else {
            setSelectedVerseId(id);
            setSelectedWordId(null);
            setSelectedWordText(null);
        }
        setModalOpen(true);
    };

    const handleLabelSelect = (key: string) => {
        if (selectedWordId !== null) {
            setWordErrors((prev) => ({ ...prev, [selectedWordId]: key }));
        } else if (selectedVerseId !== null) {
            setVerseErrors((prev) => ({ ...prev, [selectedVerseId]: key }));
        }
        setModalOpen(false);
        setSelectedWordId(null);
        setSelectedVerseId(null);
        setSelectedWordText(null);
    };

    const handleRemoveLabel = () => {
        if (selectedWordId !== null) {
            setWordErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[selectedWordId];
                return newErrors;
            });
        } else if (selectedVerseId !== null) {
            setVerseErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[selectedVerseId];
                return newErrors;
            });
        }
        setModalOpen(false);
        setSelectedWordId(null);
        setSelectedVerseId(null);
        setSelectedWordText(null);
    };

    const generateErrorsByPage = (): ErrorsByPage => {
        const errorsByPage: ErrorsByPage = {};

        Object.keys(verseErrors).forEach((verseIdStr) => {
            const verseId = Number(verseIdStr);
            const verse = verses.find((v) => v.id === verseId);
            if (verse) {
                const page = verse.page_number.toString();
                if (!errorsByPage[page]) {
                    errorsByPage[page] = { salahAyat: [], salahKata: [] };
                }
                const errorKey = verseErrors[verseId];
                const allErrorLabels = [...(errorLabels.user || []), ...(errorLabels.grup[`${selectedGrup}`] || [])];
                const errorLabel = allErrorLabels.find((label) => label.key === errorKey);

                if (errorLabel) {
                    errorsByPage[page].salahAyat.push({
                        salahKey: errorKey,
                        NamaSurat: surah.name_simple,
                        noAyat: verse.verse_number,
                        salah: errorLabel.value,
                    });
                }
            }
        });

        Object.keys(wordErrors).forEach((wordIdStr) => {
            const wordId = Number(wordIdStr);
            const verse = verses.find((v) => v.words.some((w) => w.id === wordId));
            if (verse) {
                const page = verse.page_number.toString();
                if (!errorsByPage[page]) {
                    errorsByPage[page] = { salahAyat: [], salahKata: [] };
                }
                const word = verse.words.find((w) => w.id === wordId);
                if (word) {
                    const errorKey = wordErrors[wordId];
                    // Perbaikan di sini: errorLabels.find ini mencari di seluruh label yang tersedia
                    const allErrorLabels = [...(errorLabels.user || []), ...(errorLabels.grup[`${selectedGrup}`] || [])];
                    const errorLabel = allErrorLabels.find((label) => label.key === errorKey);
                    if (errorLabel) {
                        errorsByPage[page].salahKata.push({
                            salahKey: errorKey,
                            kata: { text: word.text_uthmani },
                            word_location: word.location,
                            salah: errorLabel.value,
                        });
                    }
                }
            }
        });

        return errorsByPage;
    };

    const groupedVerses = verses.reduce(
        (acc, verse, index) => {
            const page = verse.page_number;
            if (!acc[page]) {
                acc[page] = [];
            }
            acc[page].push({ verse, index });
            return acc;
        },
        {} as { [key: number]: { verse: Verse; index: number }[] },
    );

    const valdateErrorLabels = (): ErrorLabel[] => {
        if(penyetor == "grup") {
            return errorLabels.grup[`${selectedGrup}`]
        }else {
            return errorLabels[`${penyetor}`];
        }
    }

    if (!surah || !verses || !errorLabels) {
        return <div>Data tidak tersedia.</div>;
    }

    return (
        <AppWrapper>
            <Head title={`${surah.name_simple} - Recap`} />
            <QuranHeader page={1} translateMode="read" target={route('result.index')} />
            <div className="mx-auto max-w-4xl overflow-auto p-4">
                <MistakeModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedWordId(null);
                        setSelectedVerseId(null);
                        setSelectedWordText(null);
                    }}
                    onLabelSelect={handleLabelSelect}
                    onRemoveLabel={handleRemoveLabel}
                    errorLabels={valdateErrorLabels()}
                    versesEmpty={verses.length === 0}
                    selectedWordId={selectedWordId}
                    selectedVerseId={selectedVerseId}
                    selectedWordText={selectedWordText}
                    wordErrors={wordErrors}
                    verseErrors={verseErrors}
                />
                <div className="mt-20 mb-12 text-center">
                    <p className={`text-lg text-gray-700 dark:text-gray-300`}>
                        {surah.name_simple} ({surah.id})
                    </p>
                    {surah.bismillah_pre && (
                        <p className={`font-arabic mt-6 text-4xl dark:text-gray-300 text-gray-700`} style={{ direction: 'rtl' }}>
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </p>
                    )}
                </div>
                <div
                    className={`font-arabic text-3xl dark:text-gray-300 text-gray-700`}
                    style={{
                        direction: 'rtl',
                        textAlign: 'justify',
                        textJustify: 'inter-word',
                        lineHeight: '2',
                        wordSpacing: '0.05em',
                        letterSpacing: '0.03em',
                    }}
                >
                    {verses.length > 0 ? (
                        verses.map((verse, index) => {
                            // Perbaikan di sini: errorLabels.penyetor
                            // Menggunakan optional chaining (?) pada errorLabels.penyetor
                            const verseLabel = verseErrors[verse.id]
                                ? valdateErrorLabels().find((l: ErrorLabel) => l.key === verseErrors[verse.id])
                                : null;
                            return (
                                <span key={verse.id}>
                                    <span
                                        key={verse.id}
                                        // className={cn('transition-colors duration-200', verseLabel && 'dark:text-gray-900')}
                                        className={cn(
                                            'text-gray-900 transition-colors duration-200',
                                            verseLabel ? 'dark:text-gray-900' : 'dark:text-gray-300',
                                        )}
                                        style={{
                                            backgroundColor: verseLabel?.color || 'transparent',
                                            display: verseLabel ? 'inline-block' : '',
                                            padding: verseLabel ? '3.5px 6px' : '0',
                                            lineHeight: verseLabel ? '1.5' : '2',
                                            borderRadius: verseLabel ? '6px' : '0',
                                            marginRight: '8px',
                                            verticalAlign: 'middle',
                                        }}
                                        onClick={() => handleClick('verse', verse.id)}
                                    >
                                        {verse.words.map((word) => {
                                            // Perbaikan di sini: errorLabels.user, errorLabels.grup, errorLabels.penyetor
                                            // Menggabungkan semua label untuk pencarian
                                            const allAvailableLabels = [...(errorLabels.user || []), ...(errorLabels.grup[`${selectedGrup}`] || [])];
                                            let wordLabel = wordErrors[word.id]
                                                ? allAvailableLabels.find((l) => l.key === wordErrors[word.id])
                                                : null;
                                            const s = parseInt(word.location.split(':')[1], 10);
                                            let versesLabel = verseErrors[verse.id];
                                            const wordLabels = wordLabel || versesLabel;
                                            return (
                                                <span
                                                    key={word.id}
                                                    className={cn(
                                                        'cursor-pointer text-gray-700 transition-colors duration-200 hover:text-blue-300 dark:hover:text-blue-300',
                                                        wordLabels ? 'dark:text-gray-900' : 'dark:text-gray-300',
                                                    )}
                                                    style={{
                                                        backgroundColor: wordLabel?.color || 'transparent',
                                                        display: 'inline',
                                                        lineHeight: wordLabel ? '0' : '1',
                                                        padding: wordLabel ? '9px 6px' : '0',
                                                        borderRadius: wordLabel ? '6px' : '0',
                                                        margin: wordLabel ? '4px 0' : '0',
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClick('word', word.id);
                                                    }}
                                                >
                                                    {word.text_uthmani}{' '}
                                                </span>
                                            );
                                        })}

                                        <span
                                            className="cursor-pointer transition-colors duration-200 hover:text-blue-300"
                                            onClick={() => handleClick('verse', verse.id)}
                                        >
                                            ۝{verse.end_marker || verse.verse_number}
                                        </span>
                                    </span>

                                    {groupedVerses[verse.page_number][groupedVerses[verse.page_number].length - 1].verse.id === verse.id && (
                                        <div className="my-4 flex items-center">
                                            <hr className={`flex-1 border-t border-2 dark:border-gray-600 border-gray-300`} />
                                            <span className={`mx-4 text-sm font-bold dark:text-gray-300 text-gray-700`}>Page {verse.page_number}</span>
                                            <hr className={`flex-1 border-t border-2 dark:border-gray-600 border-gray-300`} />
                                        </div>
                                    )}
                                    {index < verses.length - 1 && ' '}
                                </span>
                            );
                        })
                    ) : (
                        <div>Tidak ada data ayat untuk ditampilkan.</div>
                    )}
                </div>
            </div>
        </AppWrapper>
    );
}
