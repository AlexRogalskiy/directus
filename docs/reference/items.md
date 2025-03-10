---
pageClass: page-reference
---

# Accessing Items

<div class="two-up">
<div class="left">

> Items are individual pieces of data in your database. They can be anything, from articles, to IoT status checks.
> [Learn more about Items](/getting-started/glossary/#items).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Item Object

<div class="two-up">
<div class="left">

Items don't have a pre-defined schema. The format depends completely on how you configured your collections and fields
in Directus. For the sake of documentation, we'll use a fictional articles collection with the following fields: `id`,
`status`, `title`, `body`, `featured_image`, and `author`.

</div>
<div class="right">

```json
{
	"id": 1,
	"status": "published",
	"title": "Hello, world!",
	"body": "This is my first article",
	"featured_image": "768eabec-3c54-4110-a6bb-64b548116661",
	"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
}
```

</div>
</div>

---

## Get Items

List all items that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

::: tip Nested Data

The [Field Parameter](/reference/query/#fields) is required to return nested relational data!

:::

### Returns

An array of up to [limit](/reference/query/#limit) [item objects](#the-item-object). If no items are available, data
will be an empty array.

#### Singleton

If your collection is a singleton, this endpoint will return the item. If the item doesn't exist in the database, the
default values will be returned.

</div>
<div class="right">

### REST API

```
GET /items/:collection
SEARCH /items/:collection
```

[Learn more about SEARCH ->](/reference/introduction/#search-http-method)

##### Example

```
GET /items/articles
```

### GraphQL

```
POST /graphql
```

```graphql
type Query {
	<collection>: [<collection>]
}
```

##### Example

```graphql
query {
	articles {
		id
		title
		author {
			first_name
		}
	}
}
```

</div>
</div>

---

## Get Item by ID

Get an item that exists in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns a [item object](#the-item-object) if a valid primary key was provided.

</div>
<div class="right">

### REST API

```
GET /items/:collection/:id
```

##### Example

```
GET /items/articles/15
```

### GraphQL

```
POST /graphql
```

```graphql
type Query {
	<collection>_by_id(id: ID!): <collection>
}
```

##### Example

```graphql
query {
	articles_by_id(id: 15) {
		id
		title
	}
}
```

</div>
</div>

---

## Create an Item

Create a new item in the given collection.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [item objects](#the-item-object).

::: tip Nested Data (Relations)

Relational data needs to be correctly nested to add new items successfully. Check out the
[relational data section](/reference/introduction/#relational-data) for more information

:::

### Returns

Returns the [item objects](#the-item-object) of the item that were created.

</div>
<div class="right">

### REST API

```
POST /items/:collection
```

##### Example

```
POST /items/articles
```

```json
{
	"title": "Hello world!",
	"body": "This is our first article"
}
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	create_<collection>_item(data: create_<collection>_input): <collection>
}
```

##### Example

```graphql
mutation {
	create_articles_item(data: { title: "Hello world!", body: "This is our first article" }) {
		id
		title
	}
}
```

</div>
</div>

---

## Create Multiple Items

Create new items in the given collection.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [item objects](#the-item-object).

### Returns

Returns the [item objects](#the-item-object) of the item that were created.

</div>
<div class="right">

### REST API

```
POST /items/:collection
```

##### Example

```
POST /items/articles
```

```json
[
	{
		"title": "Hello world!",
		"body": "This is our first article"
	},
	{
		"title": "Hello again, world!",
		"body": "This is our second article"
	}
]
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	create_<collection>_items(data: [create_<collection>_input]): [<collection>]
}
```

##### Example

```graphql
mutation {
	create_articles_items(
		data: [
			{ title: "Hello world!", body: "This is our first article" }
			{ title: "Hello again, world!", body: "This is our second article" }
		]
	) {
		id
		title
	}
}
```

</div>
</div>

---

## Update an Item

Update an existing item.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [item object](#the-item-object).

### Returns

Returns the [item object](#the-item-object) of the item that was updated.

</div>
<div class="right">

### REST API

```
PATCH /items/:collection/:id
```

##### Example

```
PATCH /items/articles/15
```

```json
{
	"title": "An updated title"
}
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	update_<collection>_item(id: ID!, data: update_<collection>_input!): <collection>
}
```

##### Example

```graphql
mutation {
	update_articles_item(id: 15, data: { title: "An updated title" }) {
		id
		title
	}
}
```

</div>
</div>

---

## Update Multiple Items

Update multiple items at the same time.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [item objects](#the-item-object).

### Returns

Returns the [item objects](#the-item-object) for the updated items.

#### Singleton

If your collection is a singleton, this endpoint will act the same as the [Update an Item](#update-an-item) endpoint.

</div>
<div class="right">

### REST API

```
PATCH /items/:collection
```

##### Example

```
PATCH /items/articles
```

```json
{
	"keys": [1, 2],
	"data": {
		"status": "published"
	}
}
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	update_<collection>_items(ids: [ID!]!, data: [update_<collection>_input]): [<collection>]
}
```

##### Example

```graphql
mutation {
	update_articles_items(ids: [1, 2], data: { status: "published" }) {
		id
		status
	}
}
```

</div>
</div>

---

## Delete an Item

Delete an existing item.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /items/:collection/:id
```

##### Example

```
DELETE /items/articles/15
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	delete_<collection>_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_articles_item(id: 15) {
		id
	}
}
```

</div>
</div>

---

## Delete Multiple Items

Delete multiple existing items.

<div class="two-up">
<div class="left">

### Request Body

An array of item primary keys.

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /items/:collection
```

##### Example

```
DELETE /items/articles
```

```json
[15, 16, 21]
```

### GraphQL

```
POST /graphql
```

```graphql
type Mutation {
	delete_<collection>_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_articles_items(ids: [15, 16, 21]) {
		ids
	}
}
```

</div>
</div>
