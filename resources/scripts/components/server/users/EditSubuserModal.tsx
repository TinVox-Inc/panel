import ModalContext from '@/context/ModalContext';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useRef } from 'react';
import { array, object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import { Button } from '@/components/elements/button/index';
import PermissionRow from '@/components/server/users/PermissionRow';
import PermissionTitleBox from '@/components/server/users/PermissionTitleBox';

import asModal from '@/hoc/asModal';

import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import { usePermissions } from '@/plugins/usePermissions';

type Props = {
    subuser?: Subuser;
};

interface Values {
    email: string;
    permissions: string[];
}

const EditSubuserModal = ({ subuser }: Props) => {
    const ref = useRef<HTMLHeadingElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    // The currently logged in user's permissions. We're going to filter out any permissions
    // that they should not need.
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    useEffect(() => {
        setPropOverrides({ title: subuser ? `Permissions for ${subuser.email}` : 'Create new subuser' });
    }, []);

    // The permissions that can be modified by this user.
    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`),
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = (values: Values) => {
        setPropOverrides({ showSpinnerOverlay: true });
        clearFlashes('user:edit');

        createOrUpdateSubuser(uuid, values, subuser)
            .then((subuser) => {
                appendSubuser(subuser);
                dismiss();
            })
            .catch((error) => {
                console.error(error);
                setPropOverrides(null);
                clearAndAddHttpError({ key: 'user:edit', error });

                if (ref.current) {
                    ref.current.scrollIntoView();
                }
            });
    };

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        [],
    );

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    email: subuser?.email || '',
                    permissions: subuser?.permissions || [],
                } as Values
            }
            validationSchema={object().shape({
                email: string()
                    .max(191, 'Las direcciones de correo electrónico no deben exceder los 191 caracteres.')
                    .email('Se debe proporcionar una dirección de correo electrónico válida.')
                    .required('Se debe proporcionar una dirección de correo electrónico válida.'),
                permissions: array().of(string()),
            })}
        >
            <Form>
                <FlashMessageRender byKey={'user:edit'} />
                {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                    <div className={`mt-4 pl-4 py-2 border-l-4 border-blue-400`}>
                        <p className={`text-sm text-zinc-300`}>
                            Solo los permisos que se asigna actualmente su cuenta se pueden seleccionar al crear o
                            modificar a otros usuarios.
                        </p>
                    </div>
                )}
                {!subuser && (
                    <div className={`mb-6`}>
                        <Field
                            name={'email'}
                            label={'Correo electrónico de usuario'}
                            description={
                                'Ingrese la dirección de correo electrónico del usuario que desea invitar como subusente para este servidor.'
                            }
                        />
                    </div>
                )}
                <div className={`flex flex-col gap-4`}>
                    {Object.keys(permissions)
                        .filter((key) => key !== 'websocket')
                        .map((key, _) => (
                            <PermissionTitleBox
                                key={`permission_${key}`}
                                title={key}
                                isEditable={canEditUser}
                                permissions={Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`)}
                            >
                                <p className={`text-sm text-neutral-400 mb-4`}>{permissions[key]?.description}</p>
                                <div className='flex flex-col gap-4'>
                                    {Object.keys(permissions[key]?.keys ?? {}).map((pkey) => (
                                        <PermissionRow
                                            key={`permission_${key}.${pkey}`}
                                            permission={`${key}.${pkey}`}
                                            disabled={!canEditUser || editablePermissions.indexOf(`${key}.${pkey}`) < 0}
                                        />
                                    ))}
                                </div>
                            </PermissionTitleBox>
                        ))}
                </div>
                <Can action={subuser ? 'user.update' : 'user.create'}>
                    <div className={`my-6 flex justify-end`}>
                        <Button type={'submit'} className={`w-full sm:w-auto`}>
                            {subuser ? 'Ahorrar' : 'Invitar al usuario'}
                        </Button>
                    </div>
                </Can>
            </Form>
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
    children: <EditSubuserModal />,
})(EditSubuserModal);
