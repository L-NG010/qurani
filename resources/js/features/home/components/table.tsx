import { setupTranslations } from '@/features/i18n/i18n';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Check, Grid2X2, SquareActivity } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../components/layouts/theme-context';
import PopUp from '../../../components/ui/PopUp';

interface HistoryTableProps {
    fluidDesign: boolean;
    setoran: any[];
}

const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const day = date.getDate();
    const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const month = ucfirst(monthNames[date.getMonth()]);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}.${minutes}`;
};

const ucfirst = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const config = {
    PARENT_WEB: import.meta.env.VITE_PARENT_URL,
};

const HistoryTable: React.FC<HistoryTableProps> = ({ fluidDesign, setoran }) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation('table');
    const [translationsReady, setTranslationsReady] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        const loadTranslations = async () => {
            await setupTranslations('table');
            setTranslationsReady(true);
        };
        loadTranslations();
    }, []);

    const fetchSetoranDetails = async (id: number) => {
    try {
        const response = await axios.get(`/setoran/${id}`);
        const setoranData = {
            reciter: {
                user_id: response.data.penyetor?.username || '',
                user_name: response.data.penyetor?.username || '',
                full_name: response.data.penyetor?.fullname || '',
            },
            recipient: response.data.penerima?.fullname || '',
            setoran_type: response.data.setoran || '',
            surah_id: response.data.nomor?.toString() || '',
            surah: {
                id: response.data.nomor?.toString() || '',
                name: response.data.surah_name || '',
                from: response.data.info?.split('-')[0] || '',
                to: response.data.info?.split('-')[1] || '',
            },
            mistake: response.data.perhalaman || {},
            ket: response.data.ket || '',
            conclusion: response.data.hasil || '',
        };

        // Simpan data ke localStorage (opsional, jika diperlukan di sisi klien)
        localStorage.setItem('setoran-data', JSON.stringify(setoranData));

        // Gunakan Inertia.js untuk navigasi ke rute /result dengan data sebagai props
        router.visit('/result', {
            data: {
                surah: setoranData.surah,
                verses: [], // Tambahkan logika untuk mengambil verses jika ada di response
                // Jika verses tersedia di response, sesuaikan di sini
            },
            onSuccess: () => {
                console.log('Navigasi berhasil ke /result');
            },
            onError: (errors) => {
                console.error('Error navigasi:', errors);
                alert(t('error.fetch_failed'));
            },
        });
    } catch (error) {
        console.error('Error:', error);
        alert(t('error.fetch_failed'));
    }
};

    const openUserProfile = (username: string) => {
        window.open(`${config.PARENT_WEB}/${username}`, '_blank');
    };

    const handleSign = async (id: number) => {
        await axios.post(`/setoran/${id}/sign`);
        router.reload({ only: ['setoran'] });
        setShowPopUp(false);
    };

    return (
        <div className={fluidDesign ? 'mt-3 w-full' : 'mx-auto mt-3 w-full max-w-4xl'}>
            <div className="flex w-full justify-center">
                <div className="w-full overflow-x-auto">
                    <div className={`relative rounded-lg p-6 shadow-lg dark:bg-[rgb(38,45,52)] bg-white`}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className={`text-2xl font-semibold dark:text-white text-gray-800`}>
                                {t('history.title')}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                                    aria-label={t('history.table.table_view')}
                                    onClick={() => (window.location.href = '/dashboard')}
                                >
                                    <SquareActivity size={20} />
                                </button>
                                <button
                                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                                    title="Qurani Setting"
                                    aria-label="Settings"
                                    onClick={() => (window.location.href = '/filter')}
                                >
                                    <Grid2X2 size={20} />
                                </button>
                            </div>
                        </div>

                        <table className="w-full border-collapse border hidden md:table">
                            <thead>
                                <tr className={`dark:bg-gray-800 bg-gray-100`}>
                                    {['time', 'reciter', 'recipient', 'recite', 'results', 'signature'].map((header) => (
                                        <th
                                            key={header}
                                            className={`border px-4 py-2 text-left text-sm font-medium dark:border-gray-200 dark:text-gray-200 border-gray-600 text-gray-700'}`}
                                        >
                                            {t(`history.table.${header}`)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {setoran?.length > 0 ? (
                                    setoran.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-50'}`}
                                            onClick={() => fetchSetoranDetails(item.id)}
                                        >
                                            {['time', 'reciter', 'recipient', 'recite', 'results', 'signature'].map((col, idx) => {
                                                const value = (() => {
                                                    switch (col) {
                                                        case 'time':
                                                            return formatTime(item.time);
                                                        case 'reciter':
                                                            return item.reciter;
                                                        case 'recipient':
                                                            return item.recipient;
                                                        case 'recite':
                                                            return item.recite;
                                                        case 'results':
                                                            return t(`history.table.ratings.${item.results}`, item.results)?.toString();
                                                        case 'signature':
                                                            return (
                                                                <div className='grid place-items-center'>
                                                                    <Check
                                                                        size={20}
                                                                        className={
                                                                            item.signature === 0
                                                                                ? `cursor-pointer dark:text-gray-400 hover:text-gray-200 text-gray-400 hover:text-gray-600`
                                                                                : 'text-blue-500'
                                                                        }
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (item.signature === 0) {
                                                                                setSelectedId(item.id);
                                                                                setShowPopUp(true);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            );
                                                        default:
                                                            return '';
                                                    }
                                                })();

                                                const tdClass = `border px-4 py-2 text-sm dark:border-gray-200 dark:text-gray-200 border-gray-600 text-gray-700'} ${col === 'reciter' || col === 'recipient' ? 'hover:underline' : ''
                                                    }`;

                                                return (
                                                    <td
                                                        key={col}
                                                        className={tdClass}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (col === 'reciter') openUserProfile(item.reciter_username);
                                                            if (col === 'recipient') openUserProfile(item.recipient_username);
                                                        }}
                                                    >
                                                        {value}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className={`border px-4 py-2 text-center text-sm dark:border-gray-600 text-gray-300 border-gray-200 text-gray-600'}`}
                                        >
                                            {t('history.table.noData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile View */}
                        <div className="block md:hidden w-full">
                            {setoran?.length > 0 ? (
                                setoran.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex flex-col cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-50'} p-2 border-b dark:border-gray-600 border-gray-200'}`}
                                        onClick={() => fetchSetoranDetails(item.id)}
                                    >
                                        {['time', 'reciter', 'recipient', 'recite', 'results', 'signature'].map((col) => {
                                            const value = (() => {
                                                switch (col) {
                                                    case 'time':
                                                        return formatTime(item.time);
                                                    case 'reciter':
                                                        return item.reciter;
                                                    case 'recipient':
                                                        return item.recipient;
                                                    case 'recite':
                                                        return <span className="whitespace-nowrap">{item.recite}</span>;
                                                    case 'results':
                                                        return t(`history.table.ratings.${item.results}`, item.results)?.toString();
                                                    default:
                                                        return '';
                                                }
                                            })();

                                            const className = `px-3 py-2 text-sm dark:text-gray-200 text-gray-700'
                                                } ${col === 'reciter' || col === 'recipient' ? 'hover:underline' : ''}`;

                                            return (
                                                <div
                                                    key={col}
                                                    className={className}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (col === 'reciter') openUserProfile(item.reciter_username);
                                                        if (col === 'recipient') openUserProfile(item.recipient_username);
                                                        if (col === 'signature' && item.signature === 0) {
                                                            setSelectedId(item.id);
                                                            setShowPopUp(true);
                                                        }
                                                    }}
                                                >
                                                    <span className="inline-block w-[100px] font-medium">
                                                        {t(`history.table.${col}`)}
                                                    </span>
                                                    <span>
                                                        :{' '}
                                                        {col === 'signature' ? (
                                                            <Check
                                                                size={20}
                                                                className={
                                                                    item.signature === 0
                                                                        ? `inline-block cursor-pointer dark:text-gray-400 hover:text-gray-200 text-gray-400 hover:text-gray-600`
                                                                        : 'text-blue-500 inline-block'
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (item.signature === 0) {
                                                                        setSelectedId(item.id);
                                                                        setShowPopUp(true);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            value
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            ) : (
                                <div className={`border px-4 py-2 text-center text-sm dark:border-gray-600 text-gray-300 border-gray-200 text-gray-600'}`}>
                                    {t('history.table.noData')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showPopUp && selectedId && (
                <PopUp
                    isOpen={showPopUp}
                    onClose={() => setShowPopUp(false)}
                    onConfirm={() => handleSign(selectedId)}
                    message={t('history.confirmSignRecord')}
                />
            )}
        </div>
    );
};

export default HistoryTable;