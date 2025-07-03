import AppWrapper from '@/components/layouts/app-wrapper';
import PageHeader from '@/components/layouts/main-header';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import MistakeModal from '../../components/layouts/mistakeModal';

interface Word {
    id: number;
    position: number;
    text_uthmani: string;
    char_type_name: string;
}

interface Verse {
    id: number;
    verse_number: number;
    verse_key: string;
    text_uthmani: string;
    page_number: number;
    juz_number: number;
    end_marker: string;
    words: Word[];
}

interface Chapter {
    id: number;
    name_arabic: string;
    name_simple: string;
    translated_name: { name: string; language_name: string };
    bismillah_pre: boolean | null;
}

interface Juz {
    id: number;
    juz_number: number;
    pages: number[];
    verses_count: number;
}

interface ErrorLabel {
    id: number;
    key: string;
    value: string;
    color: string;
    status: number;
}

interface PageProps {
    juz: Juz;
    verses: Verse[];
    chapters: { [key: number]: Chapter };
    errorLabels: {
        user: ErrorLabel[];
        grup: {
            [key: number]: ErrorLabel[];
        };
    };
    [key: string]: unknown; // Add index signature to satisfy Inertia PageProps constraint
}

interface ErrorsByPage {
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
            salah: string;
        }>;
    };
}

// const errorLabels = [
//     { id: 1, key: 'sa-1', value: 'Ayat Lupa', color: '#CCCCCC', status: 1 },
//     { id: 2, key: 'sa-2', value: 'Ayat Waqaf atau Washal', color: '#99CCFF', status: 1 },
//     { id: 3, key: 'sa-3', value: 'Ayat Waqaf dan Ibtida', color: '#DFF18F', status: 1 },
//     { id: 4, key: 'sa-4', value: 'Ayat Tertukar', color: '#F4ACB6', status: 1 },
//     { id: 5, key: 'sa-5', value: 'Lainnya(Global)', color: '#FA7656', status: 1 },
//     { id: 6, key: 'sk-1', value: 'Gharib', color: '#FFCC99', status: 1 },
//     { id: 7, key: 'sk-2', value: 'Ghunnah', color: '#F4A384', status: 1 },
//     { id: 8, key: 'sk-3', value: 'Harakat tertukar', color: '#F8DD74', status: 1 },
//     { id: 9, key: 'sk-4', value: 'Huruf Tambah Kurang', color: '#FA7656', status: 1 },
//     { id: 10, key: 'sk-5', value: 'Lupa', color: '#B5C9DF', status: 1 },
//     { id: 11, key: 'sk-6', value: 'Mad', color: '#FE7D8F', status: 1 },
//     { id: 12, key: 'sk-7', value: 'Makhroj', color: '#A1D4CF', status: 1 },
//     { id: 13, key: 'sk-8', value: 'Nun Mati Tanwin', color: '#90CBAA', status: 1 },
//     { id: 14, key: 'sk-9', value: 'Qalqalah', color: '#FA7656', status: 1 },
//     { id: 15, key: 'sk-10', value: 'Tasydid', color: '#FE7D8F', status: 1 },
//     { id: 16, key: 'sk-11', value: 'Urutan Huruf / Kata', color: '#90CBAA', status: 1 },
//     { id: 17, key: 'sk-12', value: 'Waqof Washal', color: '#F8DD74', status: 1 },
//     { id: 18, key: 'sk-13', value: 'Waqaf Ibtida', color: '#CC99CC', status: 1 },
//     { id: 19, key: 'sk-14', value: 'Lainnya', color: '#CCCCCC', status: 1 },
// ];

export default function JuzIndex() {
    const { juz, verses, chapters, errorLabels } = usePage<PageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
    const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
    const [penyetor, setPenyetor] = useState<string>('');
    const [selectedGrup, setSelectedGroup] = useState<number>(0);
    const [selectedJuz, setSelectedJuz] = useState<number>(0);
    const [wordErrors, setWordErrors] = useState<{ [key: number]: string }>({});
    const [verseErrors, setVerseErrors] = useState<{ [key: number]: string }>({});
    const [selectedWordText, setSelectedWordText] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (verses.length === 0) {
            setModalOpen(true);
        }
    }, [verses]);

    useEffect(() => {
        const savedWordErrors = localStorage.getItem('wordErrors');
        const savedVerseErrors = localStorage.getItem('verseErrors');
        if (savedWordErrors) setWordErrors(JSON.parse(savedWordErrors));
        if (savedVerseErrors) setVerseErrors(JSON.parse(savedVerseErrors));
    }, []);

    useEffect(() => {
        const errorsByPage = generateErrorsByPage();
        const existingData = localStorage.getItem('setoran-data');
        let dataToSave = {
            reciter: { id: '12345', full_name: 'Ahmad Ridwan bin Abdullah' },
            setoran_type: 'tahsin',
            display: 'juz',
            surah: {
                id: `juz-${juz.juz_number}`,
                name: `Juz ${juz.juz_number}`,
                from: '1',
                to: '1',
            },
            mistake: errorsByPage,
        };
        if (existingData) {
            const parsedData = JSON.parse(existingData);
            dataToSave = { ...parsedData, surah: dataToSave.surah, mistake: errorsByPage };
            setPenyetor(parsedData.penyetor);
            setSelectedGroup(parseInt(parsedData.selectedGroup, 10));
            setSelectedJuz(parseInt(parsedData.selectedJuz, 10));
            localStorage.setItem('setoran-data', JSON.stringify(dataToSave));
        }
    }, [wordErrors, verseErrors]);

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
                // Perbaikan di sini: errorLabels.user atau errorLabels.grup
                // Asumsi errorLabels.find ini mencari di seluruh label yang tersedia
                // Jika errorLabels.penyetor juga berisi label yang relevan, Anda perlu menggabungkannya
                // Atau tentukan dari mana label ini berasal (user, grup, atau penyetor)
                const allErrorLabels = [...(errorLabels.user || []), ...(errorLabels.grup[`${selectedGrup}`] || [])];
                const errorLabel = allErrorLabels.find((label) => label.key === errorKey);
                if (errorLabel) {
                    const surahId = parseInt(verse.verse_key.split(':')[0]);
                    const surahName = chapters[surahId].name_simple;
                    errorsByPage[page].salahAyat.push({
                        salahKey: errorKey,
                        NamaSurat: surahName,
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
                            salah: errorLabel.value,
                        });
                    }
                }
            }
        });
        return errorsByPage;
    };

    const valdateErrorLabels = (): ErrorLabel[] => {
        if (penyetor == 'grup') {
            return errorLabels.grup[`${selectedGrup}`];
        } else {
            return errorLabels[`${penyetor}`];
        }
    };

    // if (true) {
    //     return (
    //         <div role="status" className='absolute right-[50%] top-[50%]'>
    //             <svg
    //                 aria-hidden="true"
    //                 className="h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
    //                 viewBox="0 0 100 101"
    //                 fill="none"
    //                 xmlns="http://www.w3.org/2000/svg"
    //             >
    //                 <path
    //                     d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
    //                     fill="currentColor"
    //                 />
    //                 <path
    //                     d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
    //                     fill="currentFill"
    //                 />
    //             </svg>
    //             <span className="sr-only">Loading...</span>
    //         </div>
    //     );
    // }

    return (
        <AppWrapper>
            <Head title="Juz" />
            <PageHeader page={1} translateMode="read" classNav="v" target={`/result/juz/${selectedJuz}`} />
            {/* <style>
                {`
                    :root {
                        --background-color: dark:#1a202c #ffffff};
                        --text-color: dark: #ffffff  #000000};
                    }
                    body {
                        background-color: var(--background-color);
                        color: var(--text-color);
                    }
                    .text-white {
                        color: var(--text-color);
                    }
                    .text-black {
                        color: var(--text-color);
                    }
                    .border-gray-300 {
                        border-color: dark:#4a5568 #e2e8f0};
                    }
                `}
            </style> */}
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
                    <p className={`text-lg dark:text-gray-300`}>Juz {juz.juz_number}</p>
                </div>
                <div
                    className={`font-arabic text-3xl dark:text-gray-300`}
                    style={{
                        direction: 'rtl',
                        textAlign: 'justify',
                        textJustify: 'inter-word',
                        lineHeight: '2',
                        wordSpacing: '0.05em',
                        letterSpacing: '0.03em',
                    }}
                >
                    {verses.map((verse, index) => {
                        const surahId = parseInt(verse.verse_key.split(':')[0]);
                        const prevVerse = index > 0 ? verses[index - 1] : null;
                        const isNewSurah = !prevVerse || surahId !== parseInt(prevVerse.verse_key.split(':')[0]);
                        const verseLabel = verseErrors[verse.id]
                            ? valdateErrorLabels().find((l: ErrorLabel) => l.key === verseErrors[verse.id])
                            : null;

                        console.log(`Rendering verse ${verse.id} from Surah ${surahId}`);

                        return (
                            <>
                                {isNewSurah && (
                                    <div key={`surah-${surahId}`} className="mb-6 text-center">
                                        <h2 className="font-arabic text-3xl font-bold dark:text-gray-300">{chapters[surahId].name_arabic}</h2>
                                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                                            {chapters[surahId].translated_name.name} ({chapters[surahId].name_simple})
                                        </p>
                                        {chapters[surahId].bismillah_pre && (
                                            <p className="font-arabic mt-4 text-3xl text-black dark:text-gray-300">
                                                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                            </p>
                                        )}
                                    </div>
                                )}
                                <span key={verse.id}>
                                    <span
                                        className={cn('transition-colors duration-200', verseLabel && 'dark:text-gray-900')}
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
                                                ? valdateErrorLabels().find((l) => l.key === wordErrors[word.id])
                                                : null;

                                            return (
                                                <span
                                                    key={word.id}
                                                    className={cn(
                                                        'cursor-pointer transition-colors duration-200 hover:text-blue-300',
                                                        wordLabel && 'dark:text-gray-900',
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

                                    {index < verses.length - 1 && verses[index + 1].page_number !== verse.page_number && (
                                        <div className="my-4 flex items-center">
                                            <hr className="flex-1 border-2 border-t border-gray-700 dark:border-gray-300" />
                                            <span className="mx-4 text-sm font-bold text-gray-700 dark:text-gray-300">Page {verse.page_number}</span>
                                            <hr className="flex-1 border-2 border-t border-gray-700 dark:border-gray-300" />
                                        </div>
                                    )}
                                </span>
                            </>
                        );
                    })}
                </div>
            </div>
        </AppWrapper>
    );
}
