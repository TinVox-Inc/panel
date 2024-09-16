import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const PIDLimitModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = [
            'pthread_create failed',
            'failed to create thread',
            'unable to create thread',
            'unable to create native thread',
            'unable to create new native thread',
            'exception in thread "craft async scheduler management thread"',
        ];

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
        clearFlashes('feature:pidLimit');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title={isAdmin ? 'Límite de memoria o procesos alcanzado' : 'Límite de recursos posiblemente alcanzado'}
        >
            <FlashMessageRender key={'feature:pidLimit'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>
                            Este servidor ha alcanzado el límite máximo de procesos, hilos o memoria. Aumentar{' '}
                            <code className={`font-mono bg-zinc-900`}>container_pid_limit</code> en la configuración de
                            Wings, <code className={`font-mono bg-zinc-900`}>config.yml</code>, puede ayudar a resolver
                            este problema.
                        </p>
                        <p className='mt-3'>
                            <b>
                                Nota: Wings debe ser reiniciado para que los cambios en el archivo de configuración
                                surtan efecto
                            </b>
                        </p>
                    </>
                ) : (
                    <>
                        <p>
                            Este servidor está intentando usar más recursos de los asignados. Por favor, contacta al
                            administrador y dale el error a continuación.
                        </p>
                        <p className='mt-3'>
                            <code className={`font-mono bg-zinc-900`}>
                                pthread_create failed, Posiblemente fuera de memoria o límite de procesos/recursos
                                alcanzado
                            </code>
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PIDLimitModalFeature;
