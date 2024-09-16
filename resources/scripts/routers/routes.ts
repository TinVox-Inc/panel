import type { ComponentType } from 'react';
import { lazy } from 'react';

import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import ShellContainer from '@/components/server/shell/ShellContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import UsersContainer from '@/components/server/users/UsersContainer';

// Each of the router files is already code split out appropriately — so
// all the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));

interface RouteDefinition {
    /**
     * Route is the path that will be matched against, this field supports wildcards.
     */
    route: string;
    /**
     * Path is the path that will be used for any navbars or links, do not use wildcards or fancy
     * matchers here. If this field is left undefined, this route will not have a navigation element,
     */
    path?: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: ComponentType;
    end?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission?: string | string[];
}

interface Routes {
    // All the routes available under "/account"
    account: RouteDefinition[];
    // All the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

export default {
    account: [
        {
            route: '',
            path: '',
            name: 'Cuenta',
            component: AccountOverviewContainer,
            end: true,
        },
        {
            route: 'api',
            path: 'api',
            name: 'API',
            component: AccountApiContainer,
        },
        {
            route: 'ssh',
            path: 'ssh',
            name: 'SSH',
            component: AccountSSHContainer,
        },
        {
            route: 'activity',
            path: 'activity',
            name: 'Actividad',
            component: ActivityLogContainer,
        },
    ],
    server: [
        {
            route: '',
            path: '',
            permission: null,
            name: 'Consola',
            component: ServerConsole,
            end: true,
        },
        {
            route: 'files/*',
            path: 'files',
            permission: 'file.*',
            name: 'Archivos',
            component: FileManagerContainer,
        },
        {
            route: 'files/:action/*',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
        },
        {
            route: 'databases/*',
            path: 'databases',
            permission: 'database.*',
            name: 'Bases de datos',
            component: DatabasesContainer,
        },
        {
            route: 'schedules/*',
            path: 'schedules',
            permission: 'schedule.*',
            name: 'Tareas',
            component: ScheduleContainer,
        },
        {
            route: 'schedules/:id/*',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
        },
        {
            route: 'users/*',
            path: 'users',
            permission: 'user.*',
            name: 'SubUsuarios',
            component: UsersContainer,
        },
        {
            route: 'backups/*',
            path: 'backups',
            permission: 'backup.*',
            name: 'Copias de seguridad',
            component: BackupContainer,
        },
        {
            route: 'network/*',
            path: 'network',
            permission: 'allocation.*',
            name: 'Red',
            component: NetworkContainer,
        },
        {
            route: 'startup/*',
            path: 'startup',
            permission: ['startup.read', 'startup.update', 'startup.docker-image'],
            name: 'Inicio',
            component: StartupContainer,
        },
        {
            route: 'settings/*',
            path: 'settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Configuración',
            component: SettingsContainer,
        },
        {
            route: 'shell/*',
            path: 'shell',
            permission: 'startup.software',
            name: 'Software',
            component: ShellContainer,
        },
        {
            route: 'activity/*',
            path: 'activity',
            permission: 'activity.*',
            name: 'Actividad',
            component: ServerActivityLogContainer,
        },
    ],
} as Routes;
