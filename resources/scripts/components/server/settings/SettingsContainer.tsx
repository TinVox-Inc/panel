import { useStoreState } from 'easy-peasy';
import isEqual from 'react-fast-compare';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Label from '@/components/elements/Label';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/elements/button/index';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';

import { ip } from '@/lib/formatters';

import { ServerContext } from '@/state/server';

import RenameServerBox from './RenameServerBox';

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Ajustes'}>
            <FlashMessageRender byKey={'settings'} />
            <MainPageHeader title={'Ajustes'} />
            <Can action={'settings.rename'}>
                <div className={`skeleton-anim-4 mb-6 md:mb-10`}>
                    <RenameServerBox />
                </div>
            </Can>
            <div className='skeleton-anim-4 w-full h-full flex flex-col gap-8'>
                <Can action={'settings.reinstall'}>
                    <ReinstallServerBox />
                </Can>
                <TitledGreyBox title={'Información de depuración'}>
                    <div className={`skeleton-anim-4 flex items-center justify-between text-sm`}>
                        <p>Nodo</p>
                        <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>{node}</code>
                    </div>
                    <CopyOnClick text={uuid}>
                        <div className={`flex items-center justify-between mt-2 text-sm`}>
                            <p>ID de servidor</p>
                            <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>{uuid}</code>
                        </div>
                    </CopyOnClick>
                </TitledGreyBox>
                <Can action={'file.sftp'}>
                    <TitledGreyBox title={'Detalles de SFTP'} className={`skeleton-anim-4 mb-6 md:mb-10`}>
                        <div className={`flex items-center justify-between text-sm`}>
                            <Label>Dirección del servidor</Label>
                            <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                <code
                                    className={`font-mono bg-zinc-900 rounded py-1 px-2`}
                                >{`sftp://${ip(sftp.ip)}:${sftp.port}`}</code>
                            </CopyOnClick>
                        </div>
                        <div className={`mt-2 flex items-center justify-between text-sm`}>
                            <Label>Nombre de usuario</Label>
                            <CopyOnClick text={`${username}.${id}`}>
                                <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>{`${username}.${id}`}</code>
                            </CopyOnClick>
                        </div>
                        <div className={`mt-6 flex items-center`}>
                            <div className={`flex-1`}>
                                <div className={`border-l-4 border-brand p-3`}>
                                    <p className={`text-xs text-zinc-200`}>
                                        Su contraseña SFTP es la misma que la contraseña que utiliza para acceder a este
                                        panel.
                                    </p>
                                </div>
                            </div>
                            <div className={`ml-4`}>
                                <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                    <Button.Text variant={Button.Variants.Secondary}>Iniciar SFTP</Button.Text>
                                </a>
                            </div>
                        </div>
                    </TitledGreyBox>
                </Can>
            </div>
        </ServerContentBlock>
    );
};
