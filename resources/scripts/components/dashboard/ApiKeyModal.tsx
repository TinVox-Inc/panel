import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';

import Button from '@/components/elements/Button';
import CopyOnClick from '@/components/elements/CopyOnClick';

import asModal from '@/hoc/asModal';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <p className={`text-sm mb-6`}>
                La clave API que ha solicitado se muestra a continuación.Por favor, almacene esto en un lugar seguro, no
                será se muestra de nuevo.
            </p>
            <pre className={`text-sm bg-zinc-900 rounded py-2 px-4 font-mono`}>
                <CopyOnClick text={apiKey}>
                    <code className={`font-mono`}>{apiKey}</code>
                </CopyOnClick>
            </pre>
            <div className={`flex justify-end mt-6`}>
                <Button type={'button'} onClick={() => dismiss()}>
                    Cerrar
                </Button>
            </div>
        </>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    title: 'Your API Key',
    closeOnEscape: false,
    closeOnBackground: false,
})(ApiKeyModal);
