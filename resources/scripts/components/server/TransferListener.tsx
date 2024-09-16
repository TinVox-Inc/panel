import { SocketEvent } from '@/components/server/events';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const TransferListener = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    // Escucha el evento de estado de transferencia para actualizar el estado del servidor.
    useWebsocketEvent(SocketEvent.TRANSFER_STATUS, (status: string) => {
        if (status === 'pending' || status === 'processing') {
            setServerFromState((s) => ({ ...s, isTransferring: true }));
            return;
        }

        if (status === 'failed') {
            setServerFromState((s) => ({ ...s, isTransferring: false }));
            return;
        }

        if (status !== 'completed') {
            return;
        }

        // Actualiza la información del servidor, ya que su nodo y asignaciones acaban de ser actualizados.
        getServer(uuid).catch((error) => console.error(error));
    });

    return null;
};

export default TransferListener;
