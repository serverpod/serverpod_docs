# Relation queries

Serverpod has support for query for nested data structures and `include` one or more object within the objects retrieved from the database. In postgresql this is known as a join. The `include` functionality is enabled for any models that has a [relation](/concepts/relations/one-to-one) to another model.

The `include` method has a typed interface and contains all the declared relations in your yaml file.

## Read

The following examples return a user with the nested address object.

```dart
var user = await Employee.db.findById(
  session,
  employeeId,
  include: Employee.include(
    address: Address.include(),
  ),
);
```

It is also possible to include deeply nested objects. The following example returns a user with a company that has an address object.

```dart
var user = await Employee.db.findById(
  session,
  employeeId,
  include: Employee.include(
    company: Company.include(
      address: Address.include(),
    ),
  ),
);
```

Any relational object can be included or not when making a query but only the includes that are explicitly defined will be included in the result. For example to include several different objects you simply specify all the named parameters.

```dart
var user = await Employee.db.findById(
  session,
  employeeId,
  include: Employee.include(
    address: Address.include(),
    company: Company.include(
      address: Address.include(),
    ),
  ),
);
```

Including a list of objects (1:n relation) can be done with the special `includeList` method. In the simplest case, the entire list can be included like this.

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(),
  ),
);
```

The `includeList` method works slightly differently from a normal `include` and to include nested objects the `includes` field must be used. When including something on a list it means that every entry in the list will each have access to the nested object.

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(
      includes: Employee.include(
        address: Address.include(),
      ),
    ),
  ),
);
```

It is even possible to include lists within lists.

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(
      includes: Employee.include(
        tools: Tool.includeList(),
      ),
    ),
  ),
);
```

:::note
Each call to includeList (nested or not) will generate one additional query to the database behind the scenes.
:::

### Filter and sort

When working with large datasets, it's often necessary to [filter](/concepts/database/sort) and [sort](/concepts/database/filter) the records to retrieve the most relevant data. Serverpod offers methods to refine the included list of related objects:

Use the where clause to filter the results based on certain conditions. For instance, to retrieve only employees whose names start with the letter 'a':

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(
      where: (t) => t.name.ilike('a%')
    ),
  ),
);
```

The orderBy clause lets you sort the results based on a specific field. For instance, to sort employees by their names:

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(
      orderBy: Employee.t.name,
    ),
  ),
);
```

### Pagination

Paginate results by specifying a limit on the number of records and an offset. For instance, to retrieve the next 100 employees starting from the 11th record:

```dart
var user = await Company.db.findById(
  session,
  employeeId,
  include: Company.include(
    employees: Employee.includeList(
      limit: 100,
      offset: 10,
    ),
  ),
);
```

Using these methods in conjunction provides a powerful way to query, filter, and sort relational data efficiently.

## Update

Managing relationships between tables is a common task. Serverpod provides methods to link (attach) and unlink (detach) related records:

### Attach Single Row

Link an individual employee to a company. This operation associates an employee with a specific company:

```dart
var company = await Company.db.findById(session, companyId);
var employee = await Employee.db.findById(session, employeeId);

await Company.db.attachRow.employees(session, company!, employee!);
```

### Bulk Attach Rows

For scenarios where you need to associate multiple employees with a company at once, use the bulk attach method. This operation is atomic, ensuring all or none of the records are linked:

```dart
var company = await Company.db.findById(session, companyId);
var employee = await Employee.db.findById(session, employeeId);

await Company.db.attach.employees(session, company!, [employee!]);
```

### Detach Single Row

To remove the association between an employee and a company, use the detach row method:

```dart
var employee = await Employee.db.findById(session, employeeId);

await Company.db.detachRow.employees(session, employee!);
```

### Bulk Detach Rows

In cases where you need to remove associations for multiple employees simultaneously, use the bulk detach method. This operation is atomic:

```dart
var employee = await Employee.db.findById(session, employeeId);

await Company.db.detach.employees(session, [employee!]);
```

:::note
When using the attach and detach methods the objects passed to them have to have the `id` field set.

The detach method is also required to have the related nested object set if you make the call from the side that does not hold the foreign key.
:::
