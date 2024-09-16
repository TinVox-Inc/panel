import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Su servidor ha comenzado el proceso de reinstalación.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Reinstalar servidor'}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirmar la reinstalación del servidor'}
                confirm={'Sí, reinstale el servidor'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                Su servidor se detendrá y algunos archivos se pueden eliminar o modificar durante este proceso, ¿está
                seguro? ¿Desea continuar?
            </Dialog.Confirm>
            <p className={`text-sm`}>
                Reinstalar su servidor lo detendrá y luego vuelva a ejecutar el script de instalación que inicialmente
                lo establece arriba.
                <strong className={`font-medium`}>
                    Algunos archivos pueden eliminarse o modificarse durante este proceso, realice una copia de
                    seguridad de sus datos antes continuo.
                </strong>
            </p>
            <div className={`mt-6 text-right`}>
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    Reinstalar servidor
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};
