import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';
import { SocketEvent, SocketRequest } from '@/components/server/events';

import updateStartupVariable from '@/api/server/updateStartupVariable';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Values {
    gslToken: string;
}

const GSLTokenModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['(gsl token expired)', '(account not found)'];

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

    const updateGSLToken = (values: Values) => {
        setLoading(true);
        clearFlashes('feature:gslToken');

        updateStartupVariable(uuid, 'STEAM_ACC', values.gslToken)
            .then(() => {
                if (instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:gslToken', error });
            })
            .finally(() => setLoading(false)); // Usa finally para asegurar que el estado de carga se resetee
    };

    useEffect(() => {
        clearFlashes('feature:gslToken');
    }, []);

    return (
        <Formik onSubmit={updateGSLToken} initialValues={{ gslToken: '' }}>
            {({ isSubmitting }) => (
                <Modal
                    visible={visible}
                    onDismissed={() => setVisible(false)}
                    closeOnBackground={false}
                    showSpinnerOverlay={loading}
                    title='¡Token GSL inválido!'
                >
                    <FlashMessageRender key={'feature:gslToken'} />
                    <Form>
                        <p>Parece que tu token de inicio de sesión de Gameserver (GSL) es inválido o ha expirado.</p>
                        <p className={`mt-3`}>
                            Puedes generar uno nuevo e ingresarlo a continuación o dejar el campo en blanco para
                            eliminarlo completamente.
                        </p>
                        <div className={`sm:flex items-center mt-6`}>
                            <Field
                                name={'gslToken'}
                                label={'Token GSL'}
                                description={
                                    'Visita https://steamcommunity.com/dev/managegameservers para generar un token.'
                                }
                                autoFocus
                            />
                        </div>
                        <div className={`my-6 sm:flex items-center justify-end`}>
                            <Button type='submit' disabled={isSubmitting}>
                                Actualizar Token GSL
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default GSLTokenModalFeature;
