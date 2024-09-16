import { useContext, useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import BackupRow from '@/components/server/backups/BackupRow';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';

import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return (
            <ServerContentBlock title={'Copias de seguridad'}>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Copias de seguridad</h1>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Copias de seguridad'}>
            <MainPageHeader title={'Copias de seguridad'}>
                <Can action={'backup.create'}>
                    <div className={`skeleton-anim-4 flex flex-col sm:flex-row items-center justify-end`}>
                        {backupLimit > 0 && backups.backupCount > 0 && (
                            <p className={`skeleton-anim-4 text-sm text-zinc-300 mb-4 sm:mr-6 sm:mb-0 text-right`}>
                                {backups.backupCount} de {backupLimit} copias de seguridad
                            </p>
                        )}
                        {backupLimit > 0 && backupLimit > backups.backupCount && <CreateBackupButton />}
                    </div>
                </Can>
            </MainPageHeader>
            <FlashMessageRender byKey={'backups'} />
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        // No mostrar ningún mensaje de error si el servidor no tiene copias de seguridad y el usuario no puede
                        // crear más para el servidor.
                        !backupLimit ? null : (
                            <p className={`text-center text-sm text-zinc-300`}>
                                {page > 1
                                    ? 'Parece que hemos agotado las copias de seguridad para mostrarte, intenta volver a la página anterior.'
                                    : 'Tu servidor no tiene copias de seguridad.'}
                            </p>
                        )
                    ) : (
                        <div
                            data-pyro-backups
                            style={{
                                background:
                                    'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
                            }}
                            className='skeleton-anim-4 p-1 border-[1px] border-[#ffffff12] rounded-xl'
                        >
                            <div className='skeleton-anim-4 flex h-full w-full flex-col gap-1 overflow-hidden rounded-lg'>
                                {items.map((backup) => (
                                    <BackupRow key={backup.uuid} backup={backup} />
                                ))}
                            </div>
                        </div>
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p className={`text-center text-sm text-zinc-300`}>
                    No se pueden crear copias de seguridad para este servidor.
                </p>
            )}
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
