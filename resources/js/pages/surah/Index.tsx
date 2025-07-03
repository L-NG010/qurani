import AppWrapper from '@/components/layouts/app-wrapper';
import QuranHeader from '@/components/layouts/main-header';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import MistakeModal from '../../components/layouts/mistakeModal';
import { cn } from '@/lib/utils';

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

const errorLabels = [
    { id: 1, key: 'sa-1', value: 'Ayat Lupa', color: '#CCCCCC', status: 1 },
    { id: 2, key: 'sa-2', value: 'Ayat Waqaf atau Washal', color: '#99CCFF', status: 1 },
    { id: 3, key: 'sa-3', value: 'Ayat Waqaf dan Ibtida', color: '#DFF18F', status: 1 },
    { id: 4, key: 'sa-4', value: 'Ayat Tertukar', color: '#F4ACB6', status: 1 },
    { id: 5, key: 'sa-5', value: 'Lainnya(Global)', color: '#FA7656', status: 1 },
    { id: 6, key: 'sk-1', value: 'Gharib', color: '#FFCC99', status: 1 },
    { id: 7, key: 'sk-2', value: 'Ghunnah', color: '#F4A384', status: 1 },
    { id: 8, key: 'sk-3', value: 'Harakat tertukar', color: '#F8DD74', status: 1 },
    { id: 9, key: 'sk-4', value: 'Huruf Tambah Kurang', color: '#FA7656', status: 1 },
    { id: 10, key: 'sk-5', value: 'Lupa', color: '#B5C9DF', status: 1 },
    { id: 11, key: 'sk-6', value: 'Mad', color: '#FE7D8F', status: 1 },
    { id: 12, key: 'sk-7', value: 'Makhroj', color: '#A1D4CF', status: 1 },
    { id: 13, key: 'sk-8', value: 'Nun Mati Tanwin', color: '#90CBAA', status: 1 },
    { id: 14, key: 'sk-9', value: 'Qalqalah', color: '#FA7656', status: 1 },
    { id: 15, key: 'sk-10', value: 'Tasydid', color: '#FE7D8F', status: 1 },
    { id: 16, key: 'sk-11', value: 'Urutan Huruf / Kata', color: '#90CBAA', status: 1 },
    { id: 17, key: 'sk-12', value: 'Waqof Washal', color: '#F8DD74', status: 1 },
    { id: 18, key: 'sk-13', value: 'Waqaf Ibtida', color: '#CC99CC', status: 1 },
    { id: 19, key: 'sk-14', value: 'Lainnya', color: '#CCCCCC', status: 1 },
];

export default function SurahIndex() {
    const { props } = usePage<PageProps>();
    const { surah, verses } = props || { surah: null, verses: [] };
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
    const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
    const [selectedWordText, setSelectedWordText] = useState<string | null>(null);
    const [wordErrors, setWordErrors] = useState<{ [key: number]: string }>({});
    const [verseErrors, setVerseErrors] = useState<{ [key: number]: string }>({});
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (!surah || !verses) {
            console.error("Data surah atau verses tidak tersedia dari server.");
            return;
        }

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialDarkMode = savedTheme === 'dark' || (savedTheme === null && prefersDark);

        setIsDarkMode(initialDarkMode);
        if (initialDarkMode) {
            document.documentElement.classList.add('dark');
            setCookie('s_night_mode', '1', 30);
        } else {
            document.documentElement.classList.remove('dark');
            setCookie('s_night_mode', '0', 30);
        }

        const listener = (e: MediaQueryListEvent) => {
            const newTheme = e.matches;
            setIsDarkMode(newTheme);
            if (newTheme) {
                document.documentElement.classList.add('dark');
                setCookie('s_night_mode', '1', 30);
            } else {
                document.documentElement.classList.remove('dark');
                setCookie('s_night_mode', '0', 30);
            }
        };
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', listener);

        return () => mq.removeEventListener('change', listener);
    }, []);

    const setCookie = (name: string, value: string, days: number) => {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    };

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newTheme = !prev;
            if (newTheme) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                setCookie('s_night_mode', '1', 30);
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                setCookie('s_night_mode', '0', 30);
            }
            return newTheme;
        });
    };

    useEffect(() => {
        if (!surah || !verses) return;

        if (verses.length === 0) {
            setModalOpen(true);
        }
    }, [verses]);

    useEffect(() => {
        if (!surah || !verses) return;

        const errorsByPage = generateErrorsByPage();
        const existingData = localStorage.getItem('setoran-data');

        const startVerse = verses.length > 0 ? verses[0].verse_number : 1;
        const endVerse = verses.length > 0 ? verses[verses.length - 1].verse_number : surah.verses_count;

        const pageNumber = verses.length > 0 ? verses[0].page_number : 1;
        const surahDetails = [{
            id: surah.id.toString(),
            name: surah.name_simple,
            first_verse: startVerse.toString(),
            last_verse: endVerse.toString(),
        }];

        let dataToSave = {
            reciter: { id: '12345', full_name: 'Ahmad Ridwan bin Abdullah' },
            setoran_type: 'tahsin',
            display: 'surat',
            surah: surahDetails,
            mistake: errorsByPage,
        };

        if (existingData) {
            const parsedData = JSON.parse(existingData);
            dataToSave = { ...parsedData, surah: dataToSave.surah, mistake: errorsByPage };
        }

        localStorage.setItem('setoran-data', JSON.stringify(dataToSave));
    }, [wordErrors, verseErrors, surah, verses]);

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
                const errorLabel = errorLabels.find((label) => label.key === errorKey);
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
                    const errorLabel = errorLabels.find((label) => label.key === errorKey);
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

    if (!surah || !verses) {
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
                    versesEmpty={verses.length === 0}
                    selectedWordId={selectedWordId}
                    selectedVerseId={selectedVerseId}
                    selectedWordText={selectedWordText}
                    wordErrors={wordErrors}
                    verseErrors={verseErrors}
                />
                <div className="mt-20 mb-12 text-center">
                    <p className={`text-lg dark:text-gray-300 text-gray-700`}>
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
                            const verseLabel = verseErrors[verse.id]
                                ? errorLabels.find((l) => l.key === verseErrors[verse.id])
                                : null;

                            return (
                                <span key={verse.id}>
                                    <span
                                        key={verse.id}
                                        className={cn("transition-colors duration-200", verseLabel && "dark:text-gray-900")}
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
                                            const wordLabel = wordErrors[word.id]
                                                ? errorLabels.find((l) => l.key === wordErrors[word.id])
                                                : null;

                                            return (
                                                <span
                                                    key={word.id}
                                                    className={cn("cursor-pointer transition-colors duration-200 hover:text-blue-300", wordLabel && "dark:text-gray-900")}
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