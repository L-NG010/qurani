import { useTheme } from '@/components/layouts/theme-context';
import Combobox from '@/components/ui/combobox';
import { setupTranslations } from '@/features/i18n/i18n';
import { Settings } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pages } from '../../constanst/pages';
import { Chapter } from '../../types/chapter';
import { Friend } from '../../types/friend';
import { Group } from '../../types/group';
import { Juz } from '../../types/juz';
import { usePage, router } from '@inertiajs/react';

// Fungsi untuk mengelola cookie
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
};

const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
};

interface Option {
    label: string;
    value: string;
}

interface DropdownVisibility {
    group: boolean;
    member: boolean;
    teman: boolean;
    surah: boolean;
    juz: boolean;
    halaman: boolean;
}

interface UserData {
    c_user?: string;
    s_lang?: string;
    s_night_mode?: string;
    user_session?: string;
    signature?: string;
}

interface SavedSetoranData {
    penyetor: string;
    setoran: string;
    display: string;
    tampilkan?: string;
    selectedGroup?: string;
    selectedMember?: string;
    selectedFriend?: string;
    selectedSurahValue?: string;
    selectedJuz?: string;
    selectedHalaman?: string;
    reciter?: { user_name: string; full_name: string };
    recipient?: string;
    surah?: Chapter;
}

interface FormErrors {
    penyetor?: string;
    setoran?: string;
    display?: string;
    group?: string;
    member?: string;
    friend?: string;
    surah?: string;
    juz?: string;
    halaman?: string;
}

interface QuraniFormProps {
    friends: Friend[];
    groups: Group[];
    chapters: Chapter[];
    juzs: Juz[];
}

const QuraniCard: React.FC<QuraniFormProps> = ({ friends, groups, chapters, juzs }) => {
    const { t } = useTranslation('form');
    const { isDarkMode } = useTheme();
    const { props } = usePage();
    const [translationsReady, setTranslationsReady] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData>({});
    const [penyetor, setPenyetor] = useState<string>('grup');
    const [setoran, setSetoran] = useState<string>('tahsin');
    const [display, setDisplay] = useState<string>('surah');
    const [tampilkan, setTampilkan] = useState<string>('surah');
    const [groupInput, setGroupInput] = useState<string>('');
    const [memberInput, setMemberInput] = useState<string>('');
    const [temanInput, setTemanInput] = useState<string>('');
    const [surahInput, setSurahInput] = useState<string>('');
    const [selectedSurahValue, setSelectedSurahValue] = useState<string>('');
    const [juzInput, setJuzInput] = useState<string>('');
    const [selectedJuz, setSelectedJuz] = useState<string>('');
    const [halamanInput, setHalamanInput] = useState<string>('');
    const [selectedHalaman, setSelectedHalaman] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [selectedFriend, setSelectedFriend] = useState<string>('');
    const [currentMembers, setCurrentMembers] = useState<Friend[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [dropdownVisibility, setDropdownVisibility] = useState<DropdownVisibility>({
        group: false,
        member: false,
        teman: false,
        surah: false,
        juz: false,
        halaman: false,
    });

    const groupDropdownRef = useRef<HTMLDivElement>(null);
    const memberDropdownRef = useRef<HTMLDivElement>(null);
    const temanDropdownRef = useRef<HTMLDivElement>(null);
    const surahDropdownRef = useRef<HTMLDivElement>(null);
    const juzDropdownRef = useRef<HTMLDivElement>(null);
    const halamanDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedData = localStorage.getItem('setoran-data');
        if (savedData) {
            try {
                const parsedData: SavedSetoranData = JSON.parse(savedData);
                setPenyetor(parsedData.penyetor || 'grup');
                setSetoran(parsedData.setoran || 'tahsin');
                setTampilkan(parsedData.tampilkan || 'surah');
                setDisplay(parsedData.display || 'surah');
                setSelectedGroup(parsedData.selectedGroup || '');
                setSelectedMember(parsedData.selectedMember || '');
                setSelectedFriend(parsedData.selectedFriend || '');
                setSelectedSurahValue(parsedData.selectedSurahValue || '');
                setSelectedJuz(parsedData.selectedJuz || '');
                setSelectedHalaman(parsedData.selectedHalaman || '');
                if (parsedData.penyetor === 'grup' && parsedData.selectedGroup) {
                    const group = groups.find((g) => g.group_id.toString() === parsedData.selectedGroup);
                    if (group) {
                        setCurrentMembers(group.users || []);
                        const member = group.users.find((u) => u.user_name === parsedData.selectedMember);
                        if (member) setSelectedMember(member.user_name);
                    }
                }
                if (parsedData.penyetor === 'teman' && parsedData.selectedFriend) {
                    setSelectedFriend(parsedData.selectedFriend);
                }
            } catch (error) {
                console.error('Error parsing saved data:', error);
                setPenyetor('grup');
                setSetoran('tahsin');
                setTampilkan('surah');
                setDisplay('surah');
            }
        }

        // Memuat tema dari cookie dan localStorage
        const savedThemeCookie = getCookie('s_night_mode');
        const savedThemeLocal = localStorage.getItem('s_night_mode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedThemeLocal || savedThemeCookie || (prefersDark ? '1' : '0');

        // Sinkronkan tema ke localStorage dan cookie jika belum ada
        if (!savedThemeLocal) {
            localStorage.setItem('s_night_mode', initialTheme);
        }
        if (!savedThemeCookie) {
            setCookie('s_night_mode', initialTheme, 30); // 30 hari kadaluarsa
        }

        // Perbarui tema
        // setIsDarkMode(initialTheme === 'true'); // Removed because setIsDarkMode does not exist
    }, [groups, useTheme]);

    useEffect(() => {
        const group = groups.find((g) => g.group_id.toString() === selectedGroup);
        setCurrentMembers(group?.users || []);
    }, [selectedGroup, groups]);

    useEffect(() => {
        const saveFormData = () => {
            const formData: SavedSetoranData = {
                penyetor,
                setoran,
                display: tampilkan,
                tampilkan,
                selectedGroup: penyetor === 'grup' ? selectedGroup : '',
                selectedMember: penyetor === 'grup' ? selectedMember : '',
                selectedFriend: penyetor === 'teman' ? selectedFriend : '',
                selectedSurahValue,
                selectedJuz,
                selectedHalaman,
            };
            localStorage.setItem('setoran-data', JSON.stringify(formData));
        };
        saveFormData();

        // Simpan tema ke localStorage dan cookie
        localStorage.setItem('s_night_mode', isDarkMode ? '1' : '0');
        setCookie('s_night_mode', isDarkMode ? '1' : '0', 30); // 30 hari kadaluarsa
    }, [penyetor, setoran, tampilkan, selectedGroup, selectedMember, selectedFriend, selectedSurahValue, selectedJuz, selectedHalaman, isDarkMode]);

    useEffect(() => {
        const loadUserData = () => {
            try {
                const storedParentData = localStorage.getItem('parent_data');
                if (storedParentData) {
                    const parsedParentData = JSON.parse(storedParentData);
                    setUserData(parsedParentData);
                }
            } catch (error) {}
        };
        loadUserData();
    }, []);

    useEffect(() => {
        const loadTranslations = async () => {
            await setupTranslations('form');
            setTranslationsReady(true);
        };
        loadTranslations();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (penyetor === 'grup') {
            if (!selectedGroup) newErrors.group = t('newErrors.Group_must_be_selected');
            if (!selectedMember) newErrors.member = t('newErrors.Member_must_be_selected');
        } else if (penyetor === 'teman') {
            if (!selectedFriend) newErrors.friend = t('newErrors.Friend_must_be_selected');
        }
        if (!setoran) newErrors.setoran = t('newErrors.Type_of_deposit_must_be_selected');
        if (!tampilkan) newErrors.tampilkan = t('newErrors.Display_must_be_selected');
        else {
            if (tampilkan === 'surah' && !selectedSurahValue) newErrors.surah = t('newErrors.Surah_must_be_selected');
            else if (tampilkan === 'juz' && !selectedJuz) newErrors.juz = t('newErrors.Juz_must_be_selected');
            else if (tampilkan === 'halaman' && !selectedHalaman) newErrors.halaman = t('newErrors.Page_must_be_selected');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getRedirectUrl = (): string => {
        switch (display) {
            case 'surah':
                return selectedSurahValue ? `/surah/${selectedSurahValue}` : '/';
            case 'juz':
                return selectedJuz ? `/juz/${selectedJuz}` : '/';
            case 'page':
                return selectedHalaman ? `/page/${selectedHalaman}` : '/';
            default:
                return '/';
        }
    };

    const handleQuickSelect = (value: string): void => {
        setSelectedSurahValue(value);
        setErrors((prev) => ({ ...prev, surah: '' }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        let reciter: { user_name: string; full_name: string } | null = null;
        if (penyetor === 'grup') {
            const group = groups.find((g) => g.group_id.toString() === selectedGroup);
            if (group) {
                const member = group.users.find((u) => u.user_name === selectedMember);
                if (member) {
                    reciter = { user_name: member.user_name, full_name: member.user_fullname };
                }
            }
        } else if (penyetor === 'teman') {
            const friend = friends.find((f) => f.user_name === selectedFriend);
            if (friend) {
                reciter = { user_name: friend.user_name, full_name: friend.user_fullname };
            }
        }

        const formData: SavedSetoranData = {
            penyetor,
            setoran,
            display: tampilkan,
            tampilkan,
            selectedGroup: penyetor === 'grup' ? selectedGroup : '',
            selectedMember: penyetor === 'grup' ? selectedMember : '',
            selectedFriend: penyetor === 'teman' ? selectedFriend : '',
            selectedSurahValue,
            selectedJuz,
            selectedHalaman,
            reciter: reciter || { user_name: '', full_name: '' },
        };

        if (tampilkan === 'surah' && selectedSurahValue) {
            const selectedChapter = chapters.find((chapter) => chapter.id.toString() === selectedSurahValue);
            if (selectedChapter) {
                formData.surah = {
                    id: selectedChapter.id,
                    name: selectedChapter.name,
                    first_verse: selectedChapter.first_verse,
                    last_verse: selectedChapter.last_verse,
                };
            }
        }

        try {
            localStorage.setItem('setoran-data', JSON.stringify(formData));
        } catch (error) {
            console.error('Error saving setoran-data:', error);
        }

        const redirectUrl = getRedirectUrl();
        console.log(redirectUrl);
        router.visit(redirectUrl);

        // if (redirectUrl !== '/') Inertia.visit(route('surah', 1));
        // // if (redirectUrl !== '/') window.location.pathname=redirectUrl;
        // else alert(t('errors.invalid_selection'));
    };

    const handleReset = (): void => {
        setPenyetor('grup');
        setSetoran('tahsin');
        setTampilkan('surah');
        setDisplay('surah');
        setGroupInput('');
        setMemberInput('');
        setTemanInput('');
        setSurahInput('');
        setSelectedSurahValue('');
        setSelectedGroup('');
        setSelectedMember('');
        setSelectedFriend('');
        setSelectedJuz('');
        setSelectedHalaman('');
        setCurrentMembers([]);
        setErrors({});
        localStorage.removeItem('setoran-data');
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            const target = e.target as Node;
            const dropdowns = [
                { ref: groupDropdownRef, inputId: 'groupInput', key: 'group' },
                { ref: memberDropdownRef, inputId: 'memberInput', key: 'member' },
                { ref: temanDropdownRef, inputId: 'temanInput', key: 'teman' },
                { ref: surahDropdownRef, inputId: 'suratInput', key: 'surah' },
                { ref: juzDropdownRef, inputId: 'juzInput', key: 'juz' },
                { ref: halamanDropdownRef, inputId: 'halamanInput', key: 'halaman' },
            ];
            dropdowns.forEach(({ ref, inputId, key }) => {
                if (ref.current && !ref.current.contains(target) && !document.getElementById(inputId)?.contains(target)) {
                    setDropdownVisibility((prev) => ({ ...prev, [key]: false }));
                }
            });
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (!translationsReady) return null;

    return (
        <div className="flex w-full justify-center px-0">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl">
                <div className={`min-h-[520px] overflow-hidden rounded-lg bg-white shadow-lg dark:bg-[rgb(38,45,52)]`}>
                    <div className={`bg-white px-4 py-3 md:px-6 dark:bg-[rgb(38,45,52)]`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-xl font-semibold text-black sm:text-2xl dark:text-white`}>{t('header')}</h2>
                            <button
                                className={`rounded-full p-2 text-gray-600 hover:cursor-pointer hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white`}
                                onClick={() => (window.top.location.href = `${import.meta.env.VITE_PARENT_URL}/settings/qurani`)}
                            >
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-4">
                                <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                    {t('labels.reciter')}
                                </label>
                                <div className="flex w-fit flex-row flex-wrap space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="penyetor"
                                            value="grup"
                                            checked={penyetor === 'grup'}
                                            onChange={(e) => {
                                                setPenyetor(e.target.value);
                                                setErrors((prev) => ({ ...prev, group: '', member: '', friend: '' }));
                                            }}
                                            className={`mr-2 dark:text-emerald-400 dark:text-emerald-600 dark:focus:ring-emerald-500 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-sm text-neutral-950 dark:text-gray-200`}>{t('radio_options.group')}</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="penyetor"
                                            value="teman"
                                            checked={penyetor === 'teman'}
                                            onChange={(e) => {
                                                setPenyetor(e.target.value);
                                                setErrors((prev) => ({ ...prev, group: '', member: '', friend: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-neutral-950'} text-sm dark:text-gray-200`}>{t('radio_options.friend')}</span>
                                    </label>
                                </div>
                                {errors.penyetor && <p className="text-sm text-red-500">{errors.penyetor}</p>}
                            </div>
                            {penyetor === 'grup' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                        <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                            {t('labels.group')}
                                        </label>
                                        <div className="w-full sm:w-96">
                                            <Combobox
                                                options={groups.map((group) => ({
                                                    label: group.group_title,
                                                    value: group.group_id.toString(),
                                                }))}
                                                placeholder={t('placeholders.select_group')}
                                                searchPlaceholder={t('placeholders.search_group')}
                                                notFoundText={t('notFoundText.group_not_found')}
                                                value={selectedGroup}
                                                onValueChange={(value) => {
                                                    setSelectedGroup(value);
                                                    setSelectedMember('');
                                                    setErrors((prev) => ({ ...prev, group: '' }));
                                                }}
                                                className={'bg-white text-black text-gray-200 dark:bg-gray-700'}
                                            />
                                            {errors.group && <p className="mt-1 text-sm text-red-500">{errors.group}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                        <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                            {t('labels.member')}
                                        </label>
                                        <div className="w-full sm:w-96">
                                            <div
                                                className={`${!selectedGroup ? 'pointer-events-none opacity-50' : ''}`}
                                                title={!selectedGroup ? 'Please select a group first' : ''}
                                            >
                                                <Combobox
                                                    options={currentMembers.map((member) => ({
                                                        label: member.user_fullname,
                                                        value: member.user_name,
                                                    }))}
                                                    placeholder={
                                                        !selectedGroup ? t('placeholders.select_group_first') : t('placeholders.select_member')
                                                    }
                                                    searchPlaceholder={!selectedGroup ? '' : t('placeholders.search_member')}
                                                    notFoundText={t('notFoundText.member_not_found')}
                                                    value={selectedMember}
                                                    onValueChange={(value) => {
                                                        setSelectedMember(value);
                                                        setErrors((prev) => ({ ...prev, member: '' }));
                                                    }}
                                                    className={'bg-white text-black text-gray-200 dark:bg-gray-700'}
                                                />
                                                {errors.member && <p className="mt-1 text-sm text-red-500">{errors.member}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {penyetor === 'teman' && (
                                <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                    <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                        {t('labels.friend')}
                                    </label>
                                    <div className="w-full sm:w-96">
                                        <Combobox
                                            options={friends.map((friend) => ({ label: friend.user_fullname, value: friend.user_name }))}
                                            placeholder={t('placeholders.select_friend')}
                                            searchPlaceholder={t('placeholders.search_friend')}
                                            notFoundText={t('notFoundText.friend_not_found')}
                                            value={selectedFriend}
                                            onValueChange={(value) => {
                                                setSelectedFriend(value);
                                                setErrors((prev) => ({ ...prev, friend: '' }));
                                            }}
                                            className={'bg-white text-black text-gray-200 dark:bg-gray-700'}
                                        />
                                        {errors.friend && <p className="mt-1 text-sm text-red-500">{errors.friend}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-4">
                                <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                    {t('labels.recite')}
                                </label>
                                <div className="flex w-fit flex-row flex-wrap space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="setoran"
                                            value="tahsin"
                                            checked={setoran === 'tahsin'}
                                            onChange={(e) => {
                                                setSetoran(e.target.value);
                                                setErrors((prev) => ({ ...prev, setoran: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-neutral-950'} text-sm dark:text-gray-200`}>{t('radio_options.tahsin')}</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="setoran"
                                            value="tahfidz"
                                            checked={setoran === 'tahfidz'}
                                            onChange={(e) => {
                                                setSetoran(e.target.value);
                                                setErrors((prev) => ({ ...prev, setoran: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-neutral-950'} text-sm dark:text-gray-200`}>{t('radio_options.tahfidz')}</span>
                                    </label>
                                </div>
                                {errors.setoran && <p className="text-sm text-red-500">{errors.setoran}</p>}
                            </div>
                            <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-4">
                                <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                    {t('labels.display')}
                                </label>
                                <div className="flex w-fit flex-row flex-wrap space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tampilkan"
                                            value="surah"
                                            checked={tampilkan === 'surah'}
                                            onChange={(e) => {
                                                setTampilkan(e.target.value);
                                                setDisplay(e.target.value);
                                                setSelectedSurahValue('');
                                                setSelectedJuz('');
                                                setSelectedHalaman('');
                                                setErrors((prev) => ({ ...prev, tampilkan: '', surah: '', juz: '', halaman: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-sm text-neutral-950 dark:text-gray-200`}>{t('radio_options.surah')}</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tampilkan"
                                            value="juz"
                                            checked={tampilkan === 'juz'}
                                            onChange={(e) => {
                                                setTampilkan(e.target.value);
                                                setDisplay(e.target.value);
                                                setSelectedSurahValue('');
                                                setSelectedJuz('');
                                                setSelectedHalaman('');
                                                setErrors((prev) => ({ ...prev, tampilkan: '', surah: '', juz: '', halaman: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-neutral-950'} text-sm dark:text-gray-200`}>{t('radio_options.juz')}</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tampilkan"
                                            value="page"
                                            checked={tampilkan === 'page'}
                                            onChange={(e) => {
                                                setTampilkan(e.target.value);
                                                setDisplay(e.target.value);
                                                setSelectedSurahValue('');
                                                setSelectedJuz('');
                                                setSelectedHalaman('');
                                                setErrors((prev) => ({ ...prev, tampilkan: '', surah: '', juz: '', halaman: '' }));
                                            }}
                                            className={`focus:ring-emerald-500'} mr-2 text-emerald-600 dark:text-emerald-400 dark:focus:ring-emerald-600`}
                                        />
                                        <span className={`text-neutral-950'} text-sm dark:text-gray-200`}>{t('radio_options.page')}</span>
                                    </label>
                                </div>
                                {errors.display && <p className="text-sm text-red-500">{errors.display}</p>}
                            </div>
                            {tampilkan === 'surah' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                        <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                            {t('labels.surah')}
                                        </label>
                                        <div className="w-full sm:w-96">
                                            <Combobox
                                                options={chapters.map((chapter) => ({
                                                    label: chapter.name + ' (' + chapter.id + ')',
                                                    value: chapter.id.toString(),
                                                }))}
                                                placeholder={t('placeholders.select_surah')}
                                                searchPlaceholder={t('placeholders.search_surah')}
                                                notFoundText={t('notFoundText.surah_not_found')}
                                                value={selectedSurahValue}
                                                onValueChange={(value) => {
                                                    setSelectedSurahValue(value);
                                                    setErrors((prev) => ({ ...prev, surah: '' }));
                                                }}
                                                className={'bg-white text-black dark:bg-gray-700 dark:text-gray-200'}
                                            />
                                            {errors.surah && <p className="mt-1 text-sm text-red-500">{errors.surah}</p>}
                                        </div>
                                    </div>
                                    <div className="ml-0 flex flex-wrap gap-2 sm:ml-26">
                                        {[
                                            { value: '1', name: t('buttons.quick_select.1') },
                                            { value: '36', name: t('buttons.quick_select.36') },
                                            { value: '112', name: t('buttons.quick_select.112') },
                                            { value: '114', name: t('buttons.quick_select.114') },
                                        ].map((button) => (
                                            <button
                                                key={button.value}
                                                type="button"
                                                className={`hover:bg-gray-400'} w-full rounded-md bg-gray-300 px-3 py-1.5 text-sm font-medium text-black hover:cursor-pointer hover:bg-gray-200 sm:w-auto dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500`}
                                                onClick={() => handleQuickSelect(button.value)}
                                            >
                                                {button.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="ml-0 flex flex-col space-x-0 pt-3 sm:ml-26 sm:flex-row sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className={`hover:bg-gray-400'} mb-2.5 w-full rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-gray-500 sm:mr-2 sm:mb-0 sm:w-auto dark:bg-gray-600`}
                                        >
                                            {t('buttons.reset')}
                                        </button>
                                        <button
                                            type="submit"
                                            className={`hover:bg-[rgb(57,69,138)]'} w-full rounded-md bg-[rgb(94,114,228)] px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 sm:w-auto dark:bg-blue-600`}
                                        >
                                            {t('buttons.submit')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {tampilkan === 'juz' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                        <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                            {t('labels.juz')}
                                        </label>
                                        <div className="w-full sm:w-96">
                                            <Combobox
                                                options={juzs.map((juz) => ({ label: juz.id.toString(), value: juz.id.toString() }))}
                                                placeholder={t('placeholders.select_juz')}
                                                searchPlaceholder={t('placeholders.search_juz')}
                                                notFoundText={t('notFoundText.juz_not_found')}
                                                value={selectedJuz}
                                                onValueChange={(value) => {
                                                    setSelectedJuz(value);
                                                    setErrors((prev) => ({ ...prev, juz: '' }));
                                                }}
                                                className={'bg-white text-black text-gray-200 dark:bg-gray-700'}
                                            />
                                            {errors.juz && <p className="mt-1 text-sm text-red-500">{errors.juz}</p>}
                                        </div>
                                    </div>
                                    <div className="ml-0 flex flex-col space-x-0 pt-13 sm:ml-26 sm:flex-row sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className={`hover:bg-gray-400'} mb-2.5 w-full rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-gray-500 sm:mr-2 sm:mb-0 sm:w-auto dark:bg-gray-600`}
                                        >
                                            {t('buttons.reset')}
                                        </button>
                                        <button
                                            type="submit"
                                            className={`hover:bg-[rgb(57,69,138)]'} w-full rounded-md bg-[rgb(94,114,228)] px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 sm:w-auto dark:bg-blue-600`}
                                        >
                                            {t('buttons.submit')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {tampilkan === 'page' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-[6rem_auto] sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                        <label className={`text-gray-700'} w-full text-sm font-medium sm:w-24 dark:text-gray-300`}>
                                            {t('labels.page')}
                                        </label>
                                        <div className="w-full sm:w-96">
                                            <Combobox
                                                options={pages.map((page) => ({ label: page.toString(), value: page.toString() }))}
                                                placeholder={t('placeholders.select_page')}
                                                searchPlaceholder={t('placeholders.search_page')}
                                                notFoundText={t('notFoundText.page_not_found')}
                                                value={selectedHalaman}
                                                onValueChange={(value) => {
                                                    setSelectedHalaman(value);
                                                    setErrors((prev) => ({ ...prev, halaman: '' }));
                                                }}
                                                className={'bg-white text-black text-gray-200 dark:bg-gray-700'}
                                            />
                                            {errors.halaman && <p className="mt-1 text-sm text-red-500">{errors.halaman}</p>}
                                        </div>
                                    </div>
                                    <div className="ml-0 flex flex-col space-x-0 pt-13 sm:ml-26 sm:flex-row sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className={`hover:bg-gray-400'} mb-2.5 w-full rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-gray-500 sm:mr-2 sm:mb-0 sm:w-auto dark:bg-gray-600`}
                                        >
                                            {t('buttons.reset')}
                                        </button>
                                        <button
                                            type="submit"
                                            className={`hover:bg-[rgb(57,69,138)]'} w-full rounded-md bg-[rgb(94,114,228)] px-4 py-2 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700 sm:w-auto dark:bg-blue-600`}
                                        >
                                            {t('buttons.submit')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuraniCard;
