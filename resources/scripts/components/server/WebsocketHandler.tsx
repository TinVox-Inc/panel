import { useEffect, useState } from 'react';

import Spinner from '@/components/elements/Spinner';
import FadeTransition from '@/components/elements/transitions/FadeTransition';

import getWebsocketToken from '@/api/server/getWebsocketToken';

import { ServerContext } from '@/state/server';

import { Websocket } from '@/plugins/Websocket';

const reconnectErrors = ['jwt: exp claim is invalid', 'jwt: created too far in past (denylist)'];

function WebsocketHandler() {
    let updatingToken = false;
    const [error, setError] = useState<'connecting' | string>('');
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const setServerStatus = ServerContext.useStoreActions((actions) => actions.status.setServerStatus);
    const { setInstance, setConnectionState } = ServerContext.useStoreActions((actions) => actions.socket);

    const updateToken = (uuid: string, socket: Websocket) => {
        if (updatingToken) {
            return;
        }

        updatingToken = true;
        getWebsocketToken(uuid)
            .then((data) => socket.setToken(data.token, true))
            .catch((error) => console.error(error))
            .then(() => {
                updatingToken = false;
            });
    };

    const connect = (uuid: string) => {
        const socket = new Websocket();

        socket.on('auth success', () => setConnectionState(true));
        socket.on('SOCKET_CLOSE', () => setConnectionState(false));
        socket.on('SOCKET_ERROR', () => {
            setError('connecting');
            setConnectionState(false);
        });
        socket.on('status', (status) => setServerStatus(status));

        socket.on('daemon error', (message) => {
            console.warn('Mensaje de error recibido del socket del demonio:', message);
        });

        socket.on('token expiring', () => updateToken(uuid, socket));
        socket.on('token expired', () => updateToken(uuid, socket));
        socket.on('jwt error', (error: string) => {
            setConnectionState(false);
            console.warn('Error de validación JWT de wings:', error);

            if (reconnectErrors.find((v) => error.toLowerCase().indexOf(v) >= 0)) {
                updateToken(uuid, socket);
            } else {
                setError(
                    'Hubo un error al validar las credenciales proporcionadas para el websocket. Por favor, actualiza la página.',
                );
            }
        });

        socket.on('transfer status', (status: string) => {
            if (status === 'starting' || status === 'success') {
                return;
            }

            // Este código fuerza una reconexión al websocket, lo cual nos conectará al nodo de destino en lugar del nodo fuente
            // para poder recibir los registros de transferencia del nodo de destino.
            socket.close();
            setError('connecting');
            setConnectionState(false);
            setInstance(null);
            connect(uuid);
        });

        getWebsocketToken(uuid)
            .then((data) => {
                // Conectar y luego establecer el token de autenticación.
                socket.setToken(data.token).connect(data.socket);

                // Una vez hecho esto, establece la instancia.
                setInstance(socket);
            })
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        connected && setError('');
    }, [connected]);

    useEffect(() => {
        return () => {
            instance && instance.close();
        };
    }, [instance]);

    useEffect(() => {
        // Si ya hay una instancia o no hay un servidor, simplemente salir de este proceso
        // ya que no necesitamos hacer una nueva conexión.
        if (instance || !uuid) {
            return;
        }

        connect(uuid);
    }, [uuid]);

    return error ? (
        <FadeTransition duration='duration-150' show>
            <div
                className={`flex items-center px-4 rounded-full fixed w-fit mx-auto left-0 right-0 top-4 bg-red-500 py-2 z-[9999]`}
            >
                {error === 'connecting' ? (
                    <>
                        <Spinner size={'small'} />
                        <p className={`ml-2 text-sm text-red-100`}>
                            Estamos teniendo algunos problemas para conectar con tu servidor, por favor espera...
                        </p>
                    </>
                ) : (
                    <p className={`ml-2 text-sm text-white`}>{error}</p>
                )}
            </div>
        </FadeTransition>
    ) : null;
}

export default WebsocketHandler;
