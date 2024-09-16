import { useLocation } from 'react-router-dom';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import PageContentBlock from '@/components/elements/PageContentBlock';

export default () => {
    const { state } = useLocation();

    return (
        <PageContentBlock title={'Your Settings'}>
            <h1 className='skeleton-anim-4 text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>
                Tu configuración
            </h1>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Su cuenta debe tener una autenticación de dos factores habilitada para continuar.
                </MessageBox>
            )}

            <div className='flex flex-col w-full h-full gap-4'>
                <h2 className='skeleton-anim-4 mt-8 font-extrabold text-2xl'>Información de la cuenta</h2>
                <ContentBox title={'Dirección de correo electrónico'} showFlashes={'account:email'}>
                    <UpdateEmailAddressForm />
                </ContentBox>
                <h2 className='skeleton-anim-4 mt-8 font-extrabold text-2xl'>Contraseña y autenticación</h2>
                <ContentBox title={'Contraseña de cuenta'} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox title={'Autenticación multifactor'}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
            </div>
        </PageContentBlock>
    );
};
