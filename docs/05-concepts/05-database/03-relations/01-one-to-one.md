# One-to-one

One-to-one (1:1) relationships represent a unique association between two entities. In Serverpod, you can define these relationships in various ways, ensuring both clarity and flexibility in database design. This documentation outlines different configurations for 1:1 relationships.

## Overview

In a 1:1 relation there is at most one entity that can be connected on either side of the relation. This means we have to set a **unique index** on the foreign key in the database. If we don't the relation would be considered as a 1:n relation.

## One side defined

In the following examples we show how to configure a `user` with one `address`. In the most simple case all we have to do is add an `id` field on one of the models.

```yaml
# address.yaml
class: Address
table: address
fields:
  street: String

# user.yaml
class: User
table: user
fields:
  addressId: int, relation(parent = address)
indexes:
  user_address_unique_idx:
    fields: addressId
    unique: true
```

In the example the addressId will hold the foreign key because we annotated the field with the `relation` keyword. The relation keyword needs to also specify a `parent` table name, if the field is of type `int`.

The addressId is **required** in this example because the field is not nullable. If you want to make an optional relation change the datatype from `int` to `int?`.

### With an object

While the previous example highlights manual handling of data, there's an alternative approach that simplifies data access using automated handling. By directly specifying the Address type in the User class, Serverpod can automatically handle the relation for you.

```yaml
# user.yaml
class: User
table: user
fields:
  address: Address?, relation
indexes:
  user_address_unique_idx:
    fields: addressId
    unique: true
```

Serverpod automatically generates a field named `addressId` in the `User` class. This auto-generated field is non-nullable by default and represents the column in the database holding the foreign key to the related `address` table.

The object field, in this case `address`, must always be nullable (as indicated by `Address?`). This ensures flexibility when fetching data, allowing you to decide whether to include the related data or not ([query relational data](#)).

No `parent` keyword is needed here because the relational table can be inferred from the type on the field.

### Optional relation

```yaml
# user.yaml
class: User
table: user
fields:
  address: Address?, relation(optional)
indexes:
  user_address_unique_idx:
    fields: addressId
    unique: true
```

With the introduction of the `optional` keyword in the relation, the automatically generated `addressId` field becomes nullable. This means that the `addressId` can either hold a foreign key to the related `address` table or be set to null, indicating no associated address.

### Custom foreign key field

In the provided example, Serverpod introduces a way to explicitly name the foreign key field using the field keyword:

```yaml
# user.yaml
class: User
table: user
fields:
  customIdField: int
  address: Address?, relation(field = customIdField)
indexes:
  user_address_unique_idx:
    fields: customIdField
    unique: true
```

With the `field` keyword, you can specify your desired name for the foreign key field. In this case, `customIdField` is used instead of the default auto-generated name.

If you want the custom foreign key to be nullable, simply define its type as `int?`. Note that the `field` keyword cannot be used in conjunction with the `optional` keyword. Instead, directly mark the field as nullable.

### Generated SQL

The following code block shows how to set up the same relation with raw SQL. Serverpod will generate this code behind the scenes.

```sql
CREATE TABLE "address" (
    "id" serial PRIMARY KEY,
    "street" text NOT NULL
);

CREATE TABLE "user" (
    "id" serial PRIMARY KEY,
    "addressId" integer NOT NULL
);


CREATE UNIQUE INDEX "user_address_unique_idx" ON "user" USING btree ("addressId");

ALTER TABLE ONLY "user"
    ADD CONSTRAINT "user_fk_0"
    FOREIGN KEY("addressId")
    REFERENCES "address"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
```

## Bidirectional Representation

The example illustrates a 1:1 relationship between User and Address where both sides of the relationship are explicitly specified.

```yaml
# user.yaml
class: User
table: user
fields:
  addressId: int
  address: Address?, relation(name = user_address, field = addressId)
indexes:
  user_address_unique_idx:
    fields: addressId
    unique: true

# address.yaml
class: Address
table: address
fields:
  street: String
  user: User?, relation(name = user_address)
```

Here we have introduced the `name` keyword. It serves as the bridge connecting the address field in the User class to the user field in the Address class. Without specifying the name, you'd end up with two unrelated relationships.

When the relationship is defined on both sides, it's **required** to specify the `field` keyword. This is because Serverpod cannot automatically determine which side should hold the foreign key field. You decide which side is most logical for your data.

In a relationship where there is an object on both sides a unique index is **required** on the foreign key field.

## Independent relations defined on both sides

You are able to establish independent relations on both sides by omitting the `name` keyword.

```yaml
# user.yaml
class: User
table: user
fields:
  friendsAddress: Address?, relation
indexes:
  user_address_unique_idx:
    fields: friendsAddressId
    unique: true

# address.yaml
class: Address
table: address
fields:
  street: String
  resident: User?, relation
indexes:
  address_user_unique_idx:
    fields: residentId
    unique: true
```

Both relations operate independently of each other. They are not connected using a shared name, resulting in two distinct relationships with their respective unique indexes. This design offers flexibility in handling data associations in different scenarios.
