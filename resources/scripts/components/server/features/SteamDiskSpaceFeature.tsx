import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const SteamDiskSpaceFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['steamcmd needs 250mb of free disk space to update', '0x202 after update job'];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:steamDiskSpace');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title='Sin espacio en disco disponible'
        >
            <FlashMessageRender key={'feature:steamDiskSpace'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>
                            Este servidor se ha quedado sin espacio en disco disponible y no puede completar el proceso
                            de instalación o actualización.
                        </p>
                        <p className='mt-3'>
                            Asegúrate de que la máquina tenga suficiente espacio en disco ejecutando{' '}
                            <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>df -h</code> en la máquina que
                            aloja este servidor. Elimina archivos o aumenta el espacio en disco disponible para resolver
                            el problema.
                        </p>
                    </>
                ) : (
                    <>
                        <p className={`mt-4`}>
                            Este servidor se ha quedado sin espacio en disco disponible y no puede completar el proceso
                            de instalación o actualización. Por favor, contacta a los administradores e infórmales sobre
                            el problema de espacio en disco.
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SteamDiskSpaceFeature;
