import {
    IconDefinition,
    faClone,
    faPen,
    faPowerOff,
    faQuestion,
    faTerminal,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import Can from '@/components/elements/Can';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import ItemContainer from '@/components/elements/ItemContainer';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';

import { httpErrorToHuman } from '@/api/http';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (action: string): [string, IconDefinition, boolean?] => {
    switch (action) {
        case 'command':
            return ['Enviar comando', faTerminal, true];
        case 'power':
            return ['Enviar acción de energía', faPowerOff];
        case 'backup':
            return ['Crear copia de seguridad', faClone];
        default:
            return ['Acción desconocida', faQuestion];
    }
};

export default ({ schedule, task }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                }),
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, icon, copyOnClick] = getActionDetails(task.action);

    return (
        <ItemContainer
            title={title}
            description={task.payload}
            icon={icon}
            divClasses={`mb-2 gap-6`}
            copyDescription={copyOnClick}
            descriptionClasses={`whitespace-nowrap overflow-hidden overflow-ellipsis`}
        >
            <SpinnerOverlay visible={isLoading} fixed size={'large'} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onModalDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={'Confirmar la eliminación de la tarea'}
                buttonText={'Eliminar tarea'}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
            </ConfirmationModal>
            {/* <FontAwesomeIcon icon={icon} className={`text-lg text-white hidden md:block`} /> */}
            {/* <div className={`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
                <p className={`md:ml-6 text-zinc-200 uppercase text-sm`}>{title}</p>
                {task.payload && (
                    <div className={`md:ml-6 mt-2`}>
                        {task.action === 'backup' && (
                            <p className={`text-xs uppercase text-zinc-400 mb-1`}>Ignoring files & folders:</p>
                        )}
                        <div
                            className={`font-mono bg-zinc-800 rounded py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
                        >
                            {task.payload}
                        </div>
                    </div>
                )}
            </div> */}
            <div className={`flex flex-none items-end sm:items-center flex-col sm:flex-row`}>
                <div className='mr-0 sm:mr-6'>
                    {task.continueOnFailure && (
                        <div className={`px-2 py-1 bg-yellow-500 text-yellow-800 text-sm rounded-full`}>
                            Continúa en el fracaso
                        </div>
                    )}
                    {task.sequenceId > 1 && task.timeOffset > 0 && (
                        <div className={`px-2 py-1 bg-zinc-500 text-sm rounded-full`}>{task.timeOffset}s later</div>
                    )}
                </div>
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Editar tarea programada'}
                        className={`block text-sm p-2 text-zinc-500 hover:text-zinc-100 transition-colors duration-150 mr-4 ml-auto sm:ml-0`}
                        onClick={() => setIsEditing(true)}
                    >
                        <FontAwesomeIcon icon={faPen} className={`px-5`} size='lg' />
                        Editar
                    </button>
                </Can>
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Eliminar tarea programada'}
                        className={`block text-sm p-2 text-zinc-500 hover:text-red-600 transition-colors duration-150`}
                        onClick={() => setVisible(true)}
                    >
                        <FontAwesomeIcon icon={faTrash} className={`px-5`} size='lg' />
                        Borrar
                    </button>
                </Can>
            </div>
        </ItemContainer>
    );
};
