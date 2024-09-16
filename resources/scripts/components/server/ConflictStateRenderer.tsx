import ScreenBlock from '@/components/elements/ScreenBlock';

import { ServerContext } from '@/state/server';

import Spinner from '../elements/Spinner';

export default () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false,
    );

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <div className={'flex items-center justify-center h-full'}>
            <Spinner size={'large'} />
            <div className='flex flex-col ml-4'>
                <label className='text-neutral-100 text-lg font-bold'>El servidor se está instalando</label>
                <label className='text-neutral-500 text-md font-semibold'>
                    Tu servidor debería estar listo pronto. Para más detalles, visita la página de inicio.
                </label>
            </div>
        </div>
    ) : status === 'suspended' ? (
        <ScreenBlock
            title={'Servidor suspendido'}
            message={'Este servidor está suspendido y no se puede acceder a él.'}
        />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            title={'Nodo en mantenimiento'}
            message={'El nodo de este servidor está actualmente en mantenimiento.'}
        />
    ) : (
        <ScreenBlock
            title={isTransferring ? 'Transfiriendo' : 'Restaurando desde copia de seguridad'}
            message={
                isTransferring
                    ? 'Tu servidor se está transfiriendo a un nuevo nodo. Por favor, vuelve a comprobar más tarde.'
                    : 'Tu servidor se está restaurando desde una copia de seguridad. Por favor, vuelve a comprobar en unos minutos.'
            }
        />
    );
};
