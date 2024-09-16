import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

import ServerRow from '@/components/dashboard/ServerRow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Tabs, TabsContent } from '@/components/elements/Tabs';

import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';

import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';

import { MainPageHeader } from '../elements/MainPageHeader';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const [dashboardDisplayOption, setDashboardDisplayOption] = usePersistedState(
        `${uuid}:dashboard_display_option`,
        'list',
    );

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined }),
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <Tabs
                defaultValue={dashboardDisplayOption}
                onValueChange={(value) => {
                    setDashboardDisplayOption(value);
                }}
                className='w-full'
            >
                <MainPageHeader title={showOnlyAdmin ? 'Otros servidores' : 'Tus servidores'}>
                    <div className='flex gap-4'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className='skeleton-anim-4 flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-md bg-[#ffffff11] hover:bg-[#ffffff22] transition hover:duration-0'>
                                    <FontAwesomeIcon icon={faFilter} />
                                    <div>Filtrar</div>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='13'
                                        height='13'
                                        viewBox='0 0 13 13'
                                        fill='none'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            clipRule='evenodd'
                                            d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                            fill='white'
                                            fillOpacity='0.37'
                                        />
                                    </svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='flex flex-col gap-1 z-[99999]' sideOffset={8}>
                                {rootAdmin && (
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            setShowOnlyAdmin((s) => !s);
                                        }}
                                    >
                                        {showOnlyAdmin ? 'Mostrar tus servidores' : 'Mostrar otros servidores'}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </MainPageHeader>
                {!servers ? (
                    <></>
                ) : (
                    <>
                        <TabsContent value='list'>
                            <Pagination data={servers} onPageSelect={setPage}>
                                {({ items }) =>
                                    items.length > 0 ? (
                                        items.map((server, index) => (
                                            <div
                                                key={server.uuid}
                                                className='transform-gpu skeleton-anim-2 mb-4'
                                                style={{
                                                    animationDelay: `${index * 50 + 50}ms`,
                                                    animationTimingFunction:
                                                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                }}
                                            >
                                                <ServerRow className='flex-row' key={server.uuid} server={server} />
                                            </div>
                                        ))
                                    ) : (
                                        <p className={`text-center text-sm text-zinc-400`}>
                                            {showOnlyAdmin
                                                ? 'No hay otros servidores que mostrar.'
                                                : 'No hay servidores asociados con su cuenta.'}
                                        </p>
                                    )
                                }
                            </Pagination>
                        </TabsContent>
                        <TabsContent value='grid'>
                            <div className='grid grid-cols-2 gap-x-4'>
                                <Pagination data={servers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            items.map((server, index) => (
                                                <div
                                                    key={server.uuid}
                                                    className='transform-gpu skeleton-anim-2 mb-4 w-full'
                                                    style={{
                                                        animation: `slideInFromTop 2s ${index * 0.2}s ${index * 0.2}s forwards`,
                                                        animationTimingFunction: 'cubic-bezier(0.42, 0, 0.58, 1)',
                                                    }}
                                                >
                                                    <ServerRow
                                                        className='!items-start flex-col w-full gap-4 [&>div~div]:w-full'
                                                        key={server.uuid}
                                                        server={server}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <p className={`text-center text-sm text-zinc-400`}>
                                                {showOnlyAdmin
                                                    ? 'No hay otros servidores que mostrar.'
                                                    : 'No hay servidores asociados con su cuenta.'}
                                            </p>
                                        )
                                    }
                                </Pagination>
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </PageContentBlock>
    );
};
