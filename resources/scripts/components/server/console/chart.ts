import {
    ChartData,
    ChartDataset,
    Chart as ChartJS,
    ChartOptions,
    Filler,
    LineElement,
    LinearScale,
    PointElement,
} from 'chart.js';
import { deepmerge, deepmergeCustom } from 'deepmerge-ts';
import { useState } from 'react';
import { DeepPartial } from 'ts-essentials';

import { hexToRgba } from '@/lib/helpers';

// Registrando los componentes necesarios para el gráfico
ChartJS.register(LineElement, PointElement, Filler, LinearScale);

const options: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    animation: false,
    plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { enabled: false },
    },
    layout: {
        padding: 0,
    },
    scales: {
        x: {
            min: 0,
            max: 19,
            type: 'linear',
            grid: {
                display: false,
            },
            ticks: {
                display: false,
            },
        },
        y: {
            min: 0,
            type: 'linear',
            grid: {
                display: false,
            },
            ticks: {
                display: true,
                count: 3,
                font: {
                    size: 11,
                    weight: 600,
                },
            },
        },
    },
    elements: {
        point: {
            radius: 0,
        },
        line: {
            tension: 0.15,
        },
    },
};

// Función para obtener opciones del gráfico con configuración personalizada
function getOptions(opts?: DeepPartial<ChartOptions<'line'>> | undefined): ChartOptions<'line'> {
    // @ts-ignore No voy a intentar explicar este error
    return deepmerge(options, opts || {});
}

// Tipo de función para modificar el conjunto de datos del gráfico
type ChartDatasetCallback = (value: ChartDataset<'line'>, index: number) => ChartDataset<'line'>;

// Función para obtener datos vacíos del gráfico
function getEmptyData(label: string, sets = 1, callback?: ChartDatasetCallback | undefined): ChartData<'line'> {
    const next = callback || ((value) => value);

    return {
        labels: Array(20)
            .fill(0)
            .map((_, index) => index),
        datasets: Array(sets)
            .fill(0)
            .map((_, index) =>
                next(
                    {
                        fill: true,
                        label,
                        data: Array(20).fill(-5),
                        borderColor: '#fa4e49',
                        backgroundColor: hexToRgba('#fa4e49', 0.09),
                    },
                    index,
                ),
            ),
    };
}

// Función personalizada de merge
const merge = deepmergeCustom({ mergeArrays: false });

interface UseChartOptions {
    sets: number;
    options?: DeepPartial<ChartOptions<'line'>> | number | undefined;
    callback?: ChartDatasetCallback | undefined;
}

// Hook para usar el gráfico
function useChart(label: string, opts?: UseChartOptions) {
    const options = getOptions(
        typeof opts?.options === 'number' ? { scales: { y: { min: 0, suggestedMax: opts.options } } } : opts?.options,
    );
    const [data, setData] = useState(getEmptyData(label, opts?.sets || 1, opts?.callback));

    // Función para añadir datos al gráfico
    const push = (items: number | null | (number | null)[]) =>
        setData((state) =>
            merge(state, {
                datasets: (Array.isArray(items) ? items : [items]).map((item, index) => ({
                    ...state.datasets[index],
                    data:
                        state.datasets[index]?.data
                            ?.slice(1)
                            ?.concat(typeof item === 'number' ? Number(item.toFixed(2)) : item) ?? [],
                })),
            }),
        );

    // Función para limpiar los datos del gráfico
    const clear = () =>
        setData((state) =>
            merge(state, {
                datasets: state.datasets.map((value) => ({
                    ...value,
                    data: Array(20).fill(-5),
                })),
            }),
        );

    return { props: { data, options }, push, clear };
}

// Hook para usar etiquetas en el gráfico
function useChartTickLabel(label: string, max: number, tickLabel: string, roundTo?: number) {
    return useChart(label, {
        sets: 1,
        options: {
            scales: {
                y: {
                    suggestedMax: max,
                    ticks: {
                        callback(value) {
                            return `${roundTo ? Number(value).toFixed(roundTo) : value}${tickLabel}`;
                        },
                    },
                },
            },
        },
    });
}

export { useChart, useChartTickLabel, getOptions, getEmptyData };
