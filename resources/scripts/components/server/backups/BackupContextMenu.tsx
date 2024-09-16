import { useState } from 'react';

import Can from '@/components/elements/Can';
import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsDelete from '@/components/elements/hugeicons/Delete';
import HugeIconsFileDownload from '@/components/elements/hugeicons/FileDownload';
import HugeIconsFileSecurity from '@/components/elements/hugeicons/FileSecurity';

import http, { httpErrorToHuman } from '@/api/http';
import { restoreServerBackup } from '@/api/server/backups';
import deleteBackup from '@/api/server/backups/deleteBackup';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    backup: ServerBackup;
}

export default ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [truncate, setTruncate] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('backups');
        deleteBackup(uuid, backup.uuid)
            .then(
                async () =>
                    await mutate(
                        (data) => ({
                            ...data!,
                            items: data!.items.filter((b) => b.uuid !== backup.uuid),
                            backupCount: data!.backupCount - 1,
                        }),
                        false,
                    ),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
                setLoading(false);
                setModal('');
            });
    };
    const doRestorationAction = () => {
        setLoading(true);
        clearFlashes('backups');
        restoreServerBackup(uuid, backup.uuid, truncate)
            .then(() =>
                setServerFromState((s) => ({
                    ...s,
                    status: 'restoring_backup',
                })),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false))
            .then(() => setModal(''));
    };

    const onLockToggle = () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        http.post(`/api/client/servers/${uuid}/backups/${backup.uuid}/lock`)
            .then(
                async () =>
                    await mutate(
                        (data) => ({
                            ...data!,
                            items: data!.items.map((b) =>
                                b.uuid !== backup.uuid
                                    ? b
                                    : {
                                          ...b,
                                          isLocked: !b.isLocked,
                                      },
                            ),
                        }),
                        false,
                    ),
            )
            .catch((error) => alert(httpErrorToHuman(error)))
            .then(() => setModal(''));
    };

    return (
        <>
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={`Desbloquear "${backup.name}"`}
                onConfirmed={onLockToggle}
            >
                Esta copia de seguridad ya no estará protegida contra eliminaciones automatizadas o accidentales.
            </Dialog.Confirm>
            <Dialog.Confirm
                open={modal === 'restore'}
                onClose={() => setModal('')}
                confirm={'Restaurar'}
                title={`Restaurar "${backup.name}"`}
                onConfirmed={() => doRestorationAction()}
            >
                <p>
                    Tu servidor será detenido. No podrás controlar el estado de encendido, acceder al gestor de archivos
                    o crear copias de seguridad adicionales hasta que se complete.
                </p>
                <p className={`mt-4 -mb-2 bg-zinc-700 p-3 rounded`}>
                    <label htmlFor={'restore_truncate'} className={`text-base flex items-center cursor-pointer`}>
                        <Input
                            type={'checkbox'}
                            id={'restore_truncate'}
                            value={'true'}
                            checked={truncate}
                            onChange={() => setTruncate((s) => !s)}
                        />
                        Eliminar todos los archivos antes de restaurar la copia de seguridad.
                    </label>
                </p>
            </Dialog.Confirm>
            <Dialog.Confirm
                title={`Eliminar "${backup.name}"`}
                confirm={'Continuar'}
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
            >
                Esta es una operación permanente. La copia de seguridad no se puede recuperar una vez eliminada.
            </Dialog.Confirm>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <ContextMenuContent className='flex flex-col gap-1'>
                    <Can action={'backup.download'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                            <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                            Descargar copia de seguridad
                        </ContextMenuItem>
                    </Can>
                    <Can action={'backup.restore'}>
                        <ContextMenuItem className='flex gap-2' onSelect={() => setModal('restore')}>
                            <HugeIconsFileDownload className='!h-4 !w-4' fill='currentColor' />
                            Restaurar copia de seguridad
                        </ContextMenuItem>
                    </Can>
                    <Can action={'backup.delete'}>
                        <>
                            <ContextMenuItem className='flex gap-2' onClick={onLockToggle}>
                                <HugeIconsFileSecurity className='!h-4 !w-4' fill='currentColor' />
                                {backup.isLocked ? 'Desbloquear' : 'Bloquear'}
                            </ContextMenuItem>
                            {!backup.isLocked && (
                                <ContextMenuItem className='flex gap-2' onSelect={() => setModal('delete')}>
                                    <HugeIconsDelete className='!h-4 !w-4' fill='currentColor' />
                                    Eliminar copia de seguridad
                                </ContextMenuItem>
                            )}
                        </>
                    </Can>
                </ContextMenuContent>
            ) : (
                <button
                    onClick={() => setModal('delete')}
                    className={`text-zinc-200 transition-colors duration-150 hover:text-zinc-100 p-2`}
                >
                    Eliminar copia de seguridad
                </button>
            )}
        </>
    );
};
