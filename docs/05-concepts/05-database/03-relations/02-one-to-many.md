# One to many

One-to-many (1:n) relationships describes a scenario where multiple records from one table can relate to a single record in another table. An example of this would the relationship between a company and its employees, where multiple employees can be employed at a single company.

The Serverpod framework provides versatility in establishing these relations. Depending on the specific use case and clarity desired, you can define the entity relationship either from the 'many' side (like `Employee`) or the 'one' side (like `Company`).

## Defining the Relationship

In the following examples we show how to configure a 1:n relationship between `Company` and `Employee`.

### Implicit Definition

With an implicit setup, Serverpod determines and establishes the relationship based on the table and class structures.

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation

# employee.yaml
class: Employee
table: employee
fields:
  name: String
```

In the example, we define a 1:n relation between `Company` and `Employee` by using the `List<Employee>` type on the `employees` field together with the `relation` keyword.

The corresponding foreign key field is automatically integrated into the 'many' side (e.g., `Employee`) as a concealed column.

When fetching companies it now becomes possible to include any or all employees in the query. 1:n relations also enables additional [filtering](../filter#1n) and [sorting](../sort#sort-on-relations) operations for [relational queries](../relation-queries).  

### Explicit Definition

In an explicit definition, you directly specify the relationship in a one-to-many relation.

This can be done by through an [object relation](one-to-one#with-an-object):

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String

# employee.yaml
class: Employee
table: employee
fields:
  name: String
  company: Company?, relation
```

Or through a [foreign key field](one-to-one#with-an-id-field):

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String

# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int, relation
```

The examples are 1:n relations because there is **no** unique index constraint on the foreign key field. This means that multiple employees can reference the same company.

## Bidirectional relations

For a more comprehensive representation, you can define the relationship from both sides. 

Either through an [object relation](one-to-one#with-an-object) on the many side:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation(name=company_employees)

# employee.yaml
class: Employee
table: employee
fields:
  name: String
  company: Company?, relation(name=company_employees)
```

Or through a [foreign key field](one-to-one#with-an-id-field) on the many side:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation(name=company_employees)

# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int, relation(name=company_employees, parent=company)
```

Just as in the 1:1 examples, the `name` parameter with a unique string that links both sides together.
