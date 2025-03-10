<template>
	<div class="metric type-title selectable" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else :style="{ color }">
			<span class="prefix">{{ prefix }}</span>
			<span class="value">{{ displayValue }}</span>
			<span class="suffix">{{ suffix }}</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import api from '@/api';
import { isEqual } from 'lodash';
import { Filter } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { abbreviateNumber } from '@/utils/abbreviate-number';
import { isNil } from 'lodash';
import { getEndpoint } from '@/utils/get-endpoint';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},

		abbreviate: {
			type: Boolean,
			default: false,
		},
		sortField: {
			type: String,
			default: undefined,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		function: {
			type: String as PropType<
				'avg' | 'avg_distinct' | 'sum' | 'sum_distinct' | 'count' | 'count_distinct' | 'min' | 'max' | 'first' | 'last'
			>,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: () => ({}),
		},
		decimals: {
			type: Number,
			default: 0,
		},
		conditionalFormatting: {
			type: Array as PropType<
				{
					operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
					color: string;
					value: number;
				}[]
			>,
			default: () => [],
		},
		prefix: {
			type: String,
			default: null,
		},
		suffix: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { n } = useI18n();

		const metric = ref();
		const loading = ref(false);

		fetchData();

		watch(
			() => props,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions)) return;
				fetchData();
			},
			{ deep: true }
		);

		const displayValue = computed(() => {
			if (isNil(metric.value)) return null;

			if (props.abbreviate) {
				return abbreviateNumber(metric.value, props.decimals ?? 0);
			}

			return n(Number(metric.value), 'decimal', {
				minimumFractionDigits: props.decimals ?? 0,
				maximumFractionDigits: props.decimals ?? 0,
			} as any);
		});

		const color = computed(() => {
			if (isNil(metric.value)) return null;

			let matchingFormat: MetricOptions['conditionalFormatting'][number] | null = null;

			for (const format of props.conditionalFormatting || []) {
				if (matchesOperator(format)) {
					matchingFormat = format;
				}
			}

			return matchingFormat ? matchingFormat.color || '#00C897' : null;

			function matchesOperator(format: MetricOptions['conditionalFormatting'][number]) {
				const value = Number(metric.value);
				const compareValue = Number(format.value ?? 0);

				switch (format.operator || '>=') {
					case '=':
						return value === compareValue;
					case '!=':
						return value !== compareValue;
					case '>':
						return value > compareValue;
					case '>=':
						return value >= compareValue;
					case '<':
						return value < compareValue;
					case '<=':
						return value < compareValue;
				}
			}
		});

		return { metric, loading, displayValue, color };

		async function fetchData() {
			if (!props) return;

			const isRawValue = ['first', 'last'].includes(props.function);

			loading.value = true;

			try {
				const sort = props.sortField && `${props.function === 'last' ? '-' : ''}${props.sortField}`;

				const aggregate = isRawValue
					? undefined
					: {
							[props.function]: [props.field || '*'],
					  };

				const res = await api.get(getEndpoint(props.collection), {
					params: {
						aggregate,
						filter: props.filter,
						sort: sort,
						limit: 1,
						fields: [props.field],
					},
				});

				if (props.field) {
					if (props.function === 'first' || props.function === 'last') {
						metric.value = Number(res.data.data[0][props.field]);
					} else {
						metric.value = Number(res.data.data[0][props.function][props.field]);
					}
				} else {
					metric.value = Number(res.data.data[0][props.function]);
				}
			} catch (err) {
				// oh no
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style scoped>
.metric {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	font-weight: 800;
	font-size: 42px;
	line-height: 52px;
}

.metric.has-header {
	height: calc(100% - 16px);
}
</style>
