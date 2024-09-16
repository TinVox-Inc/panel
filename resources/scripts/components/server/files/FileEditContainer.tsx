import { encodePathSegments } from '@/helpers';
import type { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { For } from 'million/react';
import { dirname } from 'pathe';
import { lazy } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileNameModal from '@/components/server/files/FileNameModal';

import { httpErrorToHuman } from '@/api/http';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const Editor = lazy(() => import('@/components/elements/editor/Editor'));

export default () => {
    const [error, setError] = useState('');
    const { action, '*': rawFilename } = useParams<{ action: 'edit' | 'new'; '*': string }>();
    const [_, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [language, setLanguage] = useState<LanguageDescription>();

    const [filename, setFilename] = useState<string>('');

    useEffect(() => {
        setFilename(decodeURIComponent(rawFilename ?? ''));
    }, [rawFilename]);

    const navigate = useNavigate();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (action === 'new') {
            return;
        }

        if (filename === '') {
            return;
        }

        setError('');
        setLoading(true);
        setDirectory(dirname(filename));
        getFileContents(uuid, filename)
            .then(setContent)
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, filename]);

    const save = (name?: string) => {
        return new Promise<void>((resolve, reject) => {
            setLoading(true);
            toast.success(`Guardando ${name ?? filename}...`);
            clearFlashes('files:view');
            if (fetchFileContent) {
                fetchFileContent()
                    .then((content) => saveFileContents(uuid, name ?? filename, content))
                    .then(() => {
                        toast.success(`Guardado ${name ?? filename}!`);
                        if (name) {
                            navigate(`/server/${id}/files/edit/${encodePathSegments(name)}`);
                        }
                        resolve();
                    })
                    .catch((error) => {
                        console.error(error);
                        addError({ message: httpErrorToHuman(error), key: 'files:view' });
                        reject(error);
                    })
                    .finally(() => setLoading(false));
            }
        });
    };

    const saveAndRestart = async (name?: string) => {
        try {
            await save(name);
            if (instance) {
                // se acumularán inmediatamente, así que esto ayudará
                setTimeout(() => {
                    toast.success('Su servidor se está reiniciando.');
                }, 500);
                instance.send('set state', 'restart');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (error) {
        return <div>Ocurrió un error.</div>;
    }

    return (
        <PageContentBlock title={action === 'edit' ? `Editando ${filename}` : `Nuevo Archivo`} className='!p-0'>
            <FlashMessageRender byKey={'files:view'} />

            <ErrorBoundary>
                <div
                    className={`flex py-6 bg-[#ffffff11] rounded-md rounded-b-none border-[1px] border-[#ffffff07] border-b-0`}
                >
                    <span className='-ml-[2rem]'></span>
                    <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                </div>
            </ErrorBoundary>

            {filename === '.pteroignore' ? (
                <div className={`mb-4 p-4 border-l-4 bg-neutral-900 rounded border-cyan-400`}>
                    <p className={`text-neutral-300 text-sm`}>
                        Estás editando un <code className={`font-mono bg-black rounded py-px px-1`}>.pteroignore</code>{' '}
                        archivo. Cualquier archivo o directorio enumerado aquí será excluido de las copias de seguridad.
                        Los comodines se utilizan mediante el uso de un asterisco (
                        <code className={`font-mono bg-black rounded py-px px-1`}>*</code>). Puedes negar una regla
                        anterior colocando un signo de exclamación (
                        <code className={`font-mono bg-black rounded py-px px-1`}>!</code>).
                    </p>
                </div>
            ) : null}

            <FileNameModal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                onFileNamed={(name) => {
                    setModalVisible(false);
                    save(name);
                }}
            />

            <div
                className={`relative h-full bg-[#ffffff11] border-[1px] border-[#ffffff07] border-t-0 [&>div>div]:h-full [&>div>div]:!outline-none w-full`}
            >
                <Editor
                    style={{ height: 'calc(100vh - 86px)', width: '100%' }}
                    filename={filename}
                    initialContent={content}
                    language={language}
                    onLanguageChanged={(l) => {
                        setLanguage(l);
                    }}
                    fetchContent={(value) => {
                        fetchFileContent = value;
                    }}
                    onContentSaved={() => {
                        if (action !== 'edit') {
                            setModalVisible(true);
                        } else {
                            save();
                        }
                    }}
                />
            </div>

            <div className={`flex flex-row items-center gap-4 absolute top-2.5 right-2`}>
                <DropdownMenu>
                    <DropdownMenuTrigger className='flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-md h-fit bg-[#ffffff11]'>
                        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>
                            <path
                                d='M8 12H8.00897M11.9955 12H12.0045M15.991 12H16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M18 21C19.2322 21 20.231 19.8487 20.231 18.4286C20.231 16.1808 20.1312 14.6865 21.6733 12.9091C22.1089 12.407 22.1089 11.593 21.6733 11.0909C20.1312 9.31354 20.231 7.81916 20.231 5.57143C20.231 4.15127 19.2322 3 18 3'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M6 21C4.76784 21 3.76897 19.8487 3.76897 18.4286C3.76897 16.1808 3.86877 14.6865 2.32673 12.9091C1.89109 12.407 1.89109 11.593 2.32673 11.0909C3.83496 9.35251 3.76897 7.83992 3.76897 5.57143C3.76897 4.15127 4.76784 3 6 3'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                        {language?.name ?? 'Sin lenguaje'}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <For each={Object.values(languages)}>
                            {(l) => (
                                <DropdownMenuItem
                                    key={l.name}
                                    className={language?.name === l.name ? 'bg-cyan-700' : undefined}
                                    onClick={() => setLanguage(l)}
                                >
                                    {l.name}
                                </DropdownMenuItem>
                            )}
                        </For>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Can action='editFile'>
                    <button
                        className='flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-md bg-green-700'
                        onClick={() => saveAndRestart()}
                    >
                        Guardar y Reiniciar
                    </button>
                </Can>
                <Can action='editFile'>
                    <button
                        className='flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-md bg-cyan-700'
                        onClick={() => save()}
                    >
                        Guardar
                    </button>
                </Can>
            </div>
        </PageContentBlock>
    );
};
