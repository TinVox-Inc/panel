import ModalContext from '@/context/ModalContext';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Formik, FormikHelpers } from 'formik';
// import { useContext, useEffect, useState } from 'react';
import { useContext, useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import ItemContainer from '@/components/elements/ItemContainer';
import { Button } from '@/components/elements/button/index';

// import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import asModal from '@/hoc/asModal';

import { httpErrorToHuman } from '@/api/http';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    // const [showCheatsheet, setShowCheetsheet] = useState(false);

    useEffect(() => {
        setPropOverrides({ title: schedule ? 'Editar tarea' : 'Crear nueva tarea' });
    }, []);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form>
                    <FlashMessageRender byKey={'schedule:edit'} />
                    <Field
                        name={'name'}
                        label={'Nombre de la tarea'}
                        description={'Un identificador legible humano para esta tarea.'}
                    />
                    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                        <Field name={'minute'} label={'Minuto'} />
                        <Field name={'hour'} label={'Hora'} />
                        <Field name={'dayOfMonth'} label={'Día del mes'} />
                        <Field name={'month'} label={'Mes'} />
                        <Field name={'dayOfWeek'} label={'Día de la semana'} />
                    </div>
                    <p className={`text-zinc-400 text-xs mt-2`}>
                        El sistema de programación admite el uso de la sintaxis de Cronjob al definir cuándo deben
                        comenzar las tareas correr.Use los campos anteriores para especificar cuándo estas tareas deben
                        comenzar a ejecutarse.
                    </p>
                    <div className={`space-y-3 my-6`}>
                        <a href='https://crontab.guru/' target='_blank' rel='noreferrer'>
                            <ItemContainer
                                description={'Editor en línea para expresiones de horario cron.'}
                                title={'Maestro crontab'}
                                // defaultChecked={showCheatsheet}
                                // onChange={() => setShowCheetsheet((s) => !s)}
                                labelClasses='cursor-pointer'
                            >
                                <FontAwesomeIcon icon={faUpRightFromSquare} className={`px-5`} size='lg' />
                            </ItemContainer>
                        </a>
                        {/* This table would be pretty awkward to make look nice
                            Maybe there could be an element for a dropdown later? */}
                        {/* {showCheatsheet && (
                            <div className={`block md:flex w-full`}>
                                <ScheduleCheatsheetCards />
                            </div>
                        )} */}
                        <FormikSwitchV2
                            name={'onlyWhenOnline'}
                            description={'Solo ejecute esta tarea cuando el servidor se ejecute.'}
                            label={'Solo cuando el servidor está en línea'}
                        />
                        <FormikSwitchV2
                            name={'enabled'}
                            description={'Esta tarea se ejecutará automáticamente si está habilitado.'}
                            label={'Tarea habilitada'}
                        />
                    </div>
                    <div className={`mb-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? 'Guardar cambios' : 'Crear horario'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
