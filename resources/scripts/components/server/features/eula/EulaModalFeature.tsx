import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';
import { SocketEvent, SocketRequest } from '@/components/server/events';

import saveFileContents from '@/api/server/files/saveFileContents';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const EulaModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const listener = (line: string) => {
            if (line.toLowerCase().includes('you need to agree to the eula in order to run the server')) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    const onAcceptEULA = () => {
        setLoading(true);
        clearFlashes('feature:eula');

        saveFileContents(uuid, 'eula.txt', 'eula=true')
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:eula', error });
            })
            .finally(() => setLoading(false));
    };

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            closeOnBackground={false}
            showSpinnerOverlay={loading}
            title='Aceptar EULA de Minecraft'
        >
            <div className='flex flex-col'>
                <FlashMessageRender byKey={'feature:eula'} />
                <p className='text-zinc-200'>
                    Antes de iniciar tu servidor de Minecraft, necesitas aceptar el{' '}
                    <a
                        target='_blank'
                        className='text-zinc-300 underline transition-colors duration-150 hover:text-zinc-400'
                        rel='noreferrer noopener'
                        href='https://www.minecraft.net/eula'
                    >
                        EULA de Minecraft
                    </a>
                    .
                </p>
                <div className='my-6 gap-3 flex items-center justify-end'>
                    <Button.Text onClick={() => setVisible(false)}>No acepto</Button.Text>
                    <Button onClick={onAcceptEULA}>Acepto</Button>
                </div>
            </div>
        </Modal>
    );
};

export default EulaModalFeature;
