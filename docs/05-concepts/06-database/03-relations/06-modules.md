# Relations with modules

Serverpod [modules](concepts/modules) usually come with predefined tables and data structures. Sometimes it can be useful to extend them with your data structures by creating a relation to the module tables. Relations to modules come with some restrictions since you do not own the definition of the table, you cannot change the table structure of a module table.
In practice, this means you are never able to create a many-to-many relation as that would require a modification of the module model definition.

## One to one

Creating a relation to a module table is as easy as any other relation, simply reference the module class as the datatype. As for all one-to-one relations, we have to add a unique index to the relation field.

```yaml
class: User
table: user
fields:
  userInfo: module:auth:UserInfo?, relation
  age: int
indexes:
  user_info_id_unique_idx:
    fields: userInfoId
    unique: true
```

Or by referencing the table name if you only want to access the id.

```yaml
class: User
table: user
fields:
  userInfoId: int, relation(parent=serverpod_user_info)
  age: int
indexes:
  user_info_id_unique_idx:
    fields: userInfoId
    unique: true
```

## One to many

A direct one-to-many relation is not supported as that would imply that the module table would have to be modified. But this limitation can be worked around by creating a "bridge" table and then creating a one-to-many relation to this new table instead!

```yaml
class: Employee
table: employee
fields:
  userInfo: module:auth:UserInfo?, relation
  company: Company, relation(name=company_employee)
indexes:
  user_info_friend_unique_idx:
    fields: userInfoId, companyId
    unique: true
```

```yaml
class: Company
table: company
fields:
  employees: List<Employee>?, relation(name=company_employee)
```

As seen a bridge table just stores a reference to both related tables. We have added a unique index to the combination of the fields. This means we have restricted the data to have duplicated entries otherwise the same user could be included in the list twice.
