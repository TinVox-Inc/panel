import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';

import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/elements/button/index';

import { httpErrorToHuman } from '@/api/http';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import rotateDatabasePassword from '@/api/server/databases/rotateDatabasePassword';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface RotatePasswordButtonProps {
    databaseId: string;
    onUpdate: (database: ServerDatabase) => void;
}

export default ({ databaseId, onUpdate }: RotatePasswordButtonProps) => {
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const server = ServerContext.useStoreState((state) => state.server.data!);

    if (!databaseId) {
        return null;
    }

    const rotate = () => {
        setLoading(true);
        clearFlashes();

        rotateDatabasePassword(server.uuid, databaseId)
            .then((database) => onUpdate(database))
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                    key: 'database-connection-modal',
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Button onClick={rotate} className='flex-none' aria-label='Rotate database password'>
            <div className='flex justify-center items-center h-4 w-4'>
                {!loading ? <FontAwesomeIcon icon={faRotateRight} /> : <Spinner size={'small'} />}
            </div>
        </Button>
    );
};
