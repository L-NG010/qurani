import AppWrapper from '@/components/layouts/app-wrapper';
import Combobox from '@/components/ui/combobox';
import { router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../components/layouts/theme-context';
import { Auth } from '@/types';

// Updated Surah interface to match localStorage structure
interface Surah {
    id: string;
    name: string;
    first_verse?: string;
    last_verse?: string;
}

interface Reciter {
    user_name: string;
    full_name: string;
}

interface SalahAyat {
    salahKey: string;
    NamaSurah: string;
    noAyat: number;
    salah: string;
}

interface SalahKata {
    salahKey: string;
    kata: { text: string };
    salah: string;
}

interface Mistake {
    [page: string]: {
        salahAyat: SalahAyat[];
        salahKata: SalahKata[];
        kesimpulan: string;
        catatan: string;
    };
}

interface PerhalamanItem {
    halaman: string;
    kesimpulan: string;
    catatan: string;
    salah_ayat: SalahAyat[];
    salah_kata: SalahKata[];
}

interface SetoranData {
    reciter: Reciter;
    penyetor: string;
    recipient: string;
    setoran: string;
    tampilan: string;
    surah: Surah[];
    mistake: Mistake;
    display: string;
}

interface VerseOption {
    value: string;
    label: string;
}

interface FormData {
    reciter: Reciter | null;
    recipient: string;
    setoran: string;
    display: string;
    surah: Surah[] | null;
    mistake: Mistake;
    kesimpulan: string;
    catatan: string;
    awalAyat: string;
    akhirAyat: string;
    perhalaman: PerhalamanItem[];
    submit?: string;
}

interface ErrorLabel {
    id: number;
    key: string;
    value: string;
    color: string;
    status: number;
}

interface PageProps {
    errorLabels: {
        user: ErrorLabel[];
        grup: {
            [key: number]: ErrorLabel[];
        };
    };
    [key: string]: unknown;
}

const t = (key: string): string => {
    const translations: { [key: string]: string } = {
        'general.hasilrekap': 'Hasil Setoran',
        'rekapan.form.peserta': 'Peserta',
        'rekapan.form.awal_surah': 'Awal Surah',
        'rekapan.form.awal_ayat': 'Awal Ayat',
        'rekapan.form.akhir_surah': 'Akhir Surah',
        'rekapan.form.akhir_ayat': 'Akhir Ayat',
        'rekapan.form.kesimpulan': 'Kesimpulan',
        'rekapan.form.pilih_kesimpulan': 'Pilih Kesimpulan',
        'rekapan.form.catatan': 'Catatan',
        'rekapan.form.catatan_khusus': 'Catatan Khusus',
        'rekapan.form.kesalahan_ayat': 'Kesalahan Ayat',
        'rekapan.form.tidak_ada_kesalahan_ayat': 'Tidak Ada Kesalahan Ayat',
        'rekapan.form.kesalahan_kata': 'Kesalahan Kata',
        'rekapan.form.tidak_ada_kesalahan_kata': 'Tidak Ada Kesalahan Kata',
        'rekapan.kesimpulan_options.Excellent': 'Excellent',
        'rekapan.kesimpulan_options.Very Good': 'Very Good',
        'rekapan.kesimpulan_options.Good': 'Good',
        'rekapan.kesimpulan_options.Pass': 'Pass',
        'rekapan.kesimpulan_options.Weak': 'Weak',
        'rekapan.kesimpulan_options.Not Pass': 'Not Pass',
        'rekapan.form.mengirim': 'Mengirim...',
        'rekapan.form.kirim': 'Kirim',
        'rekapan.form.halaman': 'Halaman',
        'rekapan.form.setoran': 'Jenis Setoran',
        'placeholders.select_verse': 'Pilih Ayat',
        'placeholders.search_verse': 'Cari Ayat',
        'notFoundText.verse_not_found': 'Ayat tidak ditemukan',
        'placeholders.select_conclusion': 'Pilih Kesimpulan',
        'placeholders.search_conclusion': 'Cari Kesimpulan',
        'notFoundText.conclusion_not_found': 'Kesimpulan tidak ditemukan',
    };
    return translations[key] || key;
};

const ResultFormLayout: React.FC = () => {
    const { props } = usePage<PageProps>();
    const { isDarkMode } = useTheme();
    const [panels, setPanels] = useState<{ [key: string]: boolean }>({});
    const [setoranData, setSetoranData] = useState<SetoranData | null>(null);
    const { t } = useTranslation('resultForm');
    const [translationsReady, setTranslationsReady] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);

    useEffect(() => {
        const loadTranslations = async () => {
            // await setupTranslations('resultForm');
            setTranslationsReady(true);
        };
        loadTranslations();
    }, []);

    const form = useForm<FormData>({
        reciter: null,
        recipient: '',
        setoran: '',
        display: '',
        surah: null,
        mistake: {},
        kesimpulan: '',
        catatan: '',
        awalAyat: '',
        akhirAyat: '',
    });

    // Handle theme persistence
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);

        if (initialTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const listener = (e: MediaQueryListEvent) => {
            const newTheme = e.matches;
            if (newTheme) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        };
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', listener);

        return () => mq.removeEventListener('change', listener);
    }, []);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem('setoran-data');
            const parsedData: SetoranData | null = storedData ? JSON.parse(storedData) : null;

            if (parsedData) {
                setSetoranData(parsedData);
                const transformedMistake: Mistake = {};
                Object.entries(parsedData.mistake).forEach(([page, data]) => {
                    transformedMistake[page] = {
                        ...data,
                        kesimpulan: '',
                        catatan: '',
                    };
                });

                // Extract first_verse and last_verse from the first surah in the array
                const firstSurah = parsedData.surah[0] || {};
                const awalAyat = firstSurah.first_verse || '';
                const akhirAyat = firstSurah.last_verse || '';

                form.setData({
                    reciter: {
                        user_name: parsedData.reciter.user_name,
                        full_name: parsedData.reciter.full_name,
                    },
                    recipient: props.user_id,
                    setoran: parsedData.setoran,
                    display: parsedData.display,
                    surah: parsedData.surah,
                    mistake: transformedMistake,
                    awalAyat,
                    akhirAyat,
                    kesimpulan: '',
                    catatan: '',
                });

                if (parsedData.mistake) {
                    const initialPanels: { [key: string]: boolean } = {};
                    Object.keys(parsedData.mistake).forEach((key) => {
                        initialPanels[key] = true;
                    });
                    setPanels(initialPanels);
                }
            } else {
                setSetoranData(null);
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            setSetoranData(null);
        }
    }, []);

    const handleChange = (key: keyof FormData, value: string) => {
        form.setData(key, value);
        form.clearErrors(key);
    };

    const handlePageChange = (page: string, field: 'kesimpulan' | 'catatan') => (value: string) => {
        form.setData('mistake', {
            ...form.data.mistake,
            [page]: {
                ...form.data.mistake[page],
                [field]: value,
            },
        });
    };

    const generateVerseOptions = (parsedData: SetoranData | null): VerseOption[] => {
        if (!parsedData?.surah?.[0]) return [];

        const firstSurah = parsedData.surah[0];
        const from = parseInt(firstSurah.first_verse || '1', 10);
        const to = parseInt(firstSurah.last_verse || '1', 10);

        const options: VerseOption[] = [];
        for (let i = from; i <= to; i++) {
            options.push({ value: i.toString(), label: `Ayat ${i}` });
        }
        return options;
    };

    const generateConclusionOptions = (): { value: string; label: string }[] => {
        return ['Excellent', 'Very Good', 'Good', 'Pass', 'Weak', 'Not Pass'].map((option) => ({
            value: option,
            label: t(`rekapan.kesimpulan_options.${option}`),
        }));
    };

    const togglePanel = (page: string): void => {
        setPanels((prev) => ({ ...prev, [page]: !prev[page] }));
    };

    const getErrorColor = (salahKey: string): string => {
        return salahKey.includes('tajweed')
            ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
            : 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700';
    };

    const getErrorTextColor = (salahKey: string): string => {
        return salahKey.includes('tajweed') ? 'text-red-700 dark:text-red-200' : 'text-orange-700 dark:text-orange-200';
    };

    const getSurahName = (parsedData: SetoranData | null): string => {
        return parsedData?.surah?.[0]?.name || 'Unknown Surah';
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        form.clearErrors();

        // Validasi wajib
        if (!form.data.kesimpulan) form.setError('kesimpulan', 'Pilih kesimpulan');
        if (!form.data.awalAyat) form.setError('awalAyat', 'Pilih awal ayat');
        if (!form.data.akhirAyat) form.setError('akhirAyat', 'Pilih akhir ayat');
        if (!form.data.recipient) form.setError('recipient', 'Penerima wajib diisi');
        if (!form.data.setoran) form.setError('setoran', 'Jenis setoran wajib diisi');
        if (!form.data.display) form.setError('display', 'Tampilan wajib diisi');
        if (!form.data.surah || !form.data.surah.length) form.setError('surah', 'Surah wajib diisi');

        if (Object.keys(form.errors).length > 0) return;

        // Pastikan parseInt hanya dilakukan jika nilai ada
        const penerima = props.auth.user.user_id;
        const nomor = form.data.surah && form.data.surah.length > 0 ? parseInt(form.data.surah[0].id) : 0;

        // Transformasi data perhalaman
        const perhalamanData = Object.entries(form.data.mistake).map(([page, data]) => ({
            halaman: page,
            kesimpulan: data.kesimpulan || '',
            catatan: data.catatan || '',
            salah_ayat: data.salahAyat || [],
            salah_kata: data.salahKata || [],
        }));

        const postData = {
            penyetor: form.data.reciter?.user_name || '',
            penerima,
            setoran: form.data.setoran,
            tampilan: form.data.display,
            nomor,
            info: `${form.data.awalAyat}-${form.data.akhirAyat}`,
            hasil: form.data.kesimpulan,
            ket: form.data.catatan,
            perhalaman: perhalamanData,
        };

        axios.post('/api/result', postData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                Accept: 'application/json',
            },
        })
        .then((response) => {
            // Tampilkan notifikasi sukses
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000); // Hilang setelah 3 detik

            // Simpan data kesalahan kembali ke localStorage
            const updatedMistake = form.data.mistake;
            const existingData = localStorage.getItem('setoran-data');
            if (existingData) {
                const parsedData = JSON.parse(existingData);
                localStorage.setItem('setoran-data', JSON.stringify({ ...parsedData, mistake: updatedMistake }));
            }
            // Simpan wordErrors dan verseErrors secara terpisah
            const wordErrorsFromMistake: { [key: number]: string } = {};
            const verseErrorsFromMistake: { [key: number]: string } = {};
            // Asumsi verses tersedia dari konteks atau prop (jika tidak ada, perlu diintegrasikan)
            // Define the Verse and Word interfaces for proper typing
            interface Word {
                id: number;
                text_uthmani: string;
                [key: string]: any;
            }
            interface Verse {
                id: number;
                verse_number: number;
                words: Word[];
                [key: string]: any;
            }
            const verses: Verse[] = []; // Ganti dengan data verses yang sesuai
            Object.values(updatedMistake).forEach((pageData) => {
                pageData.salahKata.forEach((err) => {
                    const word = verses.flatMap(v => v.words).find(w => w.text_uthmani === err.kata.text);
                    if (word) {
                        wordErrorsFromMistake[word.id] = err.salahKey;
                    }
                });
                pageData.salahAyat.forEach((err) => {
                    const verse = verses.find(v => v.verse_number === err.noAyat);
                    if (verse) {
                        verseErrorsFromMistake[verse.id] = err.salahKey;
                    }
                });
            });
            localStorage.setItem('wordErrors', JSON.stringify(wordErrorsFromMistake));
            localStorage.setItem('verseErrors', JSON.stringify(verseErrorsFromMistake));

            router.visit(route('home'));
        })
        .catch((error) => {
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    form.setError(key as keyof FormData, errors[key][0]);
                });
            } else {
                console.error('Error:', error);
                form.setError('submit', 'Gagal mengirim data. Silakan coba lagi.');
            }
        });
    };

    if (!translationsReady || !setoranData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Loading data...</p>
                </div>
            </div>
        );
    }

    function checkPanel(): string {
        let result = 'tampilkan';
        const displayPanelCheck = setoranData?.penyetor == "grup"? props.errorLabels.grup[`${parseInt(setoranData.selectedGroup)}`] :props.errorLabels[`${setoranData?.penyetor}`];
        displayPanelCheck.map((v: ErrorLabel, i: number) => {
            if (v.key == 'kesimpulan') {
                result = v.value;
            }
        });
        return result;
    }

    const verseOptions: VerseOption[] = generateVerseOptions(setoranData);
    const surahName: string = getSurahName(setoranData);
    const conclusionOptions = generateConclusionOptions();

    return (
        <AppWrapper>
            <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
                <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 text-center">
                        <h1 className="text-1xl mb-1 font-bold text-gray-900 dark:text-white">{t('general.hasilrekap')}</h1>
                    </div>

                    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => window.history.back()}
                            className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        {/* Notifikasi Sukses */}
                        {showSuccessNotification && (
                            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900 p-4 flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                                <p className="text-sm text-green-700 dark:text-green-200">Data berhasil dikirim</p>
                            </div>
                        )}

                        {/* Notifikasi Sukses */}
                        {showSuccessNotification && (
                            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900 p-4 flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                                <p className="text-sm text-green-700 dark:text-green-200">Data berhasil dikirim</p>
                            </div>
                        )}

                        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 grid grid-cols-1 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {t('rekapan.form.peserta')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
                                        value={form.data.reciter?.full_name || ''}
                                        disabled
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('rekapan.form.awal_surah')}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={surahName}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('rekapan.form.awal_ayat')}
                                        </label>
                                        <div className="w-full">
                                            <Combobox
                                                options={verseOptions}
                                                placeholder={t('placeholders.select_verse')}
                                                searchPlaceholder={t('placeholders.search_verse')}
                                                notFoundText={t('notFoundText.verse_not_found')}
                                                value={form.data.awalAyat}
                                                onValueChange={(value) => handleChange('awalAyat', value)}
                                                className="w-full" // Tambahkan ini untuk menyamakan lebar dengan "Awal Surah"
                                            />
                                            {form.errors.awalAyat && (
                                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{form.errors.awalAyat}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('rekapan.form.akhir_surah')}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={surahName}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {t('rekapan.form.akhir_ayat')}
                                        </label>
                                        <div className="w-full">
                                            <Combobox
                                                options={verseOptions}
                                                placeholder={t('placeholders.select_verse')}
                                                searchPlaceholder={t('placeholders.search_verse')}
                                                notFoundText={t('notFoundText.verse_not_found')}
                                                value={form.data.akhirAyat}
                                                onValueChange={(value) => handleChange('akhirAyat', value)}
                                                className="w-full" // Tambahkan ini untuk menyamakan lebar dengan "Awal Surah"
                                            />
                                            {form.errors.akhirAyat && (
                                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{form.errors.akhirAyat}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {t('rekapan.form.kesimpulan')}
                                    </label>
                                    <div className="w-full">
                                        <Combobox
                                            options={conclusionOptions}
                                            placeholder={t('placeholders.select_conclusion')}
                                            searchPlaceholder={t('placeholders.search_conclusion')}
                                            notFoundText={t('notFoundText.conclusion_not_found')}
                                            value={form.data.kesimpulan}
                                            onValueChange={(value) => handleChange('kesimpulan', value)}
                                            className="w-full" // Tambahkan ini untuk menyamakan lebar dengan "Awal Surah"
                                        />
                                        {form.errors.kesimpulan && (
                                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{form.errors.kesimpulan}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{t('rekapan.form.catatan')}</label>
                                <textarea
                                    name="catatan"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                                    rows={3}
                                    placeholder={t('rekapan.form.catatan')}
                                    value={form.data.catatan}
                                    onChange={(e) => handleChange('catatan', e.target.value)}
                                />
                                {form.errors.catatan && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{form.errors.catatan}</p>}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="rounded-md bg-[rgb(94,114,228)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(57,69,138)] disabled:cursor-not-allowed disabled:bg-blue-300"
                                    disabled={form.processing}
                                >
                                    {form.processing ? t('rekapan.form.mengirim') : t('rekapan.form.kirim')}
                                </button>
                            </div>
                            {form.errors.submit && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{form.errors.submit}</p>}
                        </div>

                        {checkPanel() == 'tampilkan' && (
                            <div className="space-y-3">
                                {Object.entries(setoranData.mistake || {})
                                    .sort(([pageA], [pageB]) => parseInt(pageA) - parseInt(pageB))
                                    .map(([page, errors]) => (
                                        <div
                                            key={page}
                                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div
                                                className="flex cursor-pointer items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 hover:bg-blue-100 dark:border-gray-700 dark:from-blue-900 dark:to-indigo-900 dark:hover:bg-blue-800"
                                                onClick={() => togglePanel(page)}
                                            >
                                                <div className="flex items-center">
                                                    <FileText className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                                        {`${surahName} - ${t('rekapan.form.halaman')} ${page}`}
                                                    </h3>
                                                    <div className="ml-3 flex items-center space-x-2">
                                                        {form.data.mistake[page]?.salahAyat.length > 0 && (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                {form.data.mistake[page].salahAyat.length} ayat
                                                            </span>
                                                        )}
                                                        {form.data.mistake[page]?.salahKata.length > 0 && (
                                                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                                {form.data.mistake[page].salahKata.length} kata
                                                            </span>
                                                        )}
                                                        {(!form.data.mistake[page]?.salahAyat || form.data.mistake[page].salahAyat.length === 0) &&
                                                            (!form.data.mistake[page]?.salahKata ||
                                                                form.data.mistake[page].salahKata.length === 0) && (
                                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                    Perfect
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                                {panels[page] ? (
                                                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </div>

                                            {panels[page] && (
                                                <div className="space-y-4 p-4">
                                                    <div>
                                                        <div className="mb-3 flex items-center">
                                                            <AlertCircle className="mr-2 h-4 w-4 text-red-500 dark:text-red-400" />
                                                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                                                {t('rekapan.form.kesalahan_ayat')}
                                                            </h4>
                                                        </div>
                                                        {!form.data.mistake[page]?.salahAyat || form.data.mistake[page].salahAyat.length === 0 ? (
                                                            <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900">
                                                                <p className="flex items-center text-sm text-green-700 dark:text-green-200">
                                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                    {t('rekapan.form.tidak_ada_kesalahan_ayat')}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {form.data.mistake[page].salahAyat.map((err, idx) => (
                                                                    <div
                                                                        key={`verse-${idx}`}
                                                                        className={`rounded-md border p-3 ${getErrorColor(err.salahKey)}`}
                                                                    >
                                                                        <div className="flex items-start">
                                                                            <span className="mt-0.5 mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                                                {idx + 1}
                                                                            </span>
                                                                            <div className="flex flex-1 items-center">
                                                                                <span
                                                                                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${getErrorTextColor(
                                                                                        err.salahKey,
                                                                                    )}`}
                                                                                >
                                                                                    Ayah : {err.noAyat}
                                                                                </span>
                                                                                <p className="ml-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                                                    {err.salah}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="mb-3 flex items-center">
                                                            <AlertCircle className="mr-2 h-4 w-4 text-orange-500 dark:text-orange-400" />
                                                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                                                                {t('rekapan.form.kesalahan_kata')}
                                                            </h4>
                                                        </div>
                                                        {!form.data.mistake[page]?.salahKata || form.data.mistake[page].salahKata.length === 0 ? (
                                                            <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900">
                                                                <p className="flex items-center text-sm text-green-700 dark:text-green-200">
                                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                    {t('rekapan.form.tidak_ada_kesalahan_kata')}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {form.data.mistake[page].salahKata.map((err, idx) => (
                                                                    <div
                                                                        key={`word-${idx}`}
                                                                        className={`rounded-md border p-3 ${getErrorColor(err.salahKey)}`}
                                                                    >
                                                                        <div className="flex items-start">
                                                                            <span className="mt-0.5 mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                                                {idx + 1}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center">
                                                                                    <span
                                                                                        className={`inline-block rounded-md border bg-white px-2 py-1 text-base dark:bg-gray-700 ${getErrorTextColor(
                                                                                            err.salahKey,
                                                                                        )}`}
                                                                                        style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
                                                                                    >
                                                                                        {err.kata?.text || ''}
                                                                                    </span>
                                                                                    <p className="ml-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                                                                        {err.salah}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                    {t('rekapan.form.kesimpulan')}
                                                                </label>
                                                                <div className="w-full">
                                                                    <Combobox
                                                                        options={conclusionOptions}
                                                                        placeholder={t('placeholders.select_conclusion')}
                                                                        searchPlaceholder={t('placeholders.search_conclusion')}
                                                                        notFoundText={t('notFoundText.conclusion_not_found')}
                                                                        value={form.data.mistake[page]?.kesimpulan || ''}
                                                                        onValueChange={handlePageChange(page, 'kesimpulan')}
                                                                        className={isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-black'}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                    {t('rekapan.form.catatan')}
                                                                </label>
                                                                <textarea
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                                                                    rows={2}
                                                                    placeholder={t('rekapan.form.catatan_khusus')}
                                                                    value={form.data.mistake[page]?.catatan || ''}
                                                                    onChange={(e) => handlePageChange(page, 'catatan')(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppWrapper>
    );
};

export default ResultFormLayout;
