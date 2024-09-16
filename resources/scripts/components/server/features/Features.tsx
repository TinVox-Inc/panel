import type { ComponentType } from 'react';
import { Suspense, useMemo } from 'react';

import { getObjectKeys } from '@/lib/objects';
import features from './index';

type ListItems = [string, ComponentType][]; // Tupla de un string y un componente React

export default ({ enabled }: { enabled: string[] }) => {
    // Memoriza la lista de componentes habilitados para evitar cálculos innecesarios
    const mapped: ListItems = useMemo(() => {
        return getObjectKeys(features)
            .filter((key) => enabled.map((v) => v.toLowerCase()).includes(key.toLowerCase()))
            .reduce((arr, key) => [...arr, [key, features[key]]] as ListItems, [] as ListItems);
    }, [enabled]);

    return (
        <Suspense fallback={null}>
            {mapped.map(([key, Component]) => (
                <Component key={key} />
            ))}
        </Suspense>
    );
};
