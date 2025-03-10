import SchemaInspector from '@directus/schema';
import { Knex } from 'knex';
import { mapValues } from 'lodash';
import { systemCollectionRows } from '../database/system-data/collections';
import { systemFieldRows } from '../database/system-data/fields';
import logger from '../logger';
import { RelationsService } from '../services';
import { SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
import { toArray } from '@directus/shared/utils';
import getDefaultValue from './get-default-value';
import getLocalType from './get-local-type';
import getDatabase from '../database';
import { getCache } from '../cache';
import env from '../env';

export async function getSchema(options?: {
	accountability?: Accountability;
	database?: Knex;
}): Promise<SchemaOverview> {
	const database = options?.database || getDatabase();
	const schemaInspector = SchemaInspector(database);
	const { systemCache } = getCache();

	let result: SchemaOverview;

	if (env.CACHE_SCHEMA !== false) {
		let cachedSchema;

		try {
			cachedSchema = (await systemCache.get('schema')) as SchemaOverview;
		} catch (err: any) {
			logger.warn(err, `[schema-cache] Couldn't retrieve cache. ${err}`);
		}

		if (cachedSchema) {
			result = cachedSchema;
		} else {
			result = await getDatabaseSchema(database, schemaInspector);

			try {
				await systemCache.set('schema', result);
			} catch (err: any) {
				logger.warn(err, `[schema-cache] Couldn't save cache. ${err}`);
			}
		}
	} else {
		result = await getDatabaseSchema(database, schemaInspector);
	}

	return result;
}

async function getDatabaseSchema(
	database: Knex,
	schemaInspector: ReturnType<typeof SchemaInspector>
): Promise<SchemaOverview> {
	const result: SchemaOverview = {
		collections: {},
		relations: [],
	};

	const schemaOverview = await schemaInspector.overview();

	const collections = [
		...(await database
			.select('collection', 'singleton', 'note', 'sort_field', 'accountability')
			.from('directus_collections')),
		...systemCollectionRows,
	];

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (toArray(env.DB_EXCLUDE_TABLES).includes(collection)) {
			logger.trace(`Collection "${collection}" is configured to be excluded and will be ignored`);
			continue;
		}

		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			continue;
		}

		if (collection.includes(' ')) {
			logger.warn(`Collection "${collection}" has a space in the name and will be ignored`);
			continue;
		}

		const collectionMeta = collections.find((collectionMeta) => collectionMeta.collection === collection);

		result.collections[collection] = {
			collection,
			primary: info.primary,
			singleton:
				collectionMeta?.singleton === true || collectionMeta?.singleton === 'true' || collectionMeta?.singleton === 1,
			note: collectionMeta?.note || null,
			sortField: collectionMeta?.sort_field || null,
			accountability: collectionMeta ? collectionMeta.accountability : 'all',
			fields: mapValues(schemaOverview[collection].columns, (column) => {
				return {
					field: column.column_name,
					defaultValue: getDefaultValue(column) ?? null,
					nullable: column.is_nullable ?? true,
					generated: column.is_generated ?? false,
					type: getLocalType(column).type,
					dbType: column.data_type,
					precision: column.numeric_precision || null,
					scale: column.numeric_scale || null,
					special: [],
					note: null,
					alias: false,
				};
			}),
		};
	}

	const fields = [
		...(await database
			.select<{ id: number; collection: string; field: string; special: string; note: string | null }[]>(
				'id',
				'collection',
				'field',
				'special',
				'note'
			)
			.from('directus_fields')),
		...systemFieldRows,
	].filter((field) => (field.special ? toArray(field.special) : []).includes('no-data') === false);

	for (const field of fields) {
		if (!result.collections[field.collection]) continue;

		const existing = result.collections[field.collection].fields[field.field];
		const column = schemaOverview[field.collection].columns[field.field];
		const special = field.special ? toArray(field.special) : [];
		const { type = 'alias' } = existing && column ? getLocalType(column, { special }) : {};

		result.collections[field.collection].fields[field.field] = {
			field: field.field,
			defaultValue: existing?.defaultValue ?? null,
			nullable: existing?.nullable ?? true,
			generated: existing?.generated ?? false,
			type: type,
			dbType: existing?.dbType || null,
			precision: existing?.precision || null,
			scale: existing?.scale || null,
			special: special,
			note: field.note,
			alias: existing?.alias ?? true,
		};
	}

	const relationsService = new RelationsService({ knex: database, schema: result });
	result.relations = await relationsService.readAll();

	return result;
}
