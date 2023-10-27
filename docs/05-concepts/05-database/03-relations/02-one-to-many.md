# One to many

A one-to-many (1:n) relation delineates the connection where multiple records from one table correspond to a singular record in another table. Within the Serverpod framework, an example of this would be multiple employees associated with a singular company. Every employee corresponds uniquely to one particular company.

## Defining the Relationship

Serverpod provides versatility in establishing these relations. Depending on the specific use case and clarity desired, you can define the relationship either from the side of the many entities (like `Employee`) or the singular entity (like `Company`).

### Implicit Definition

With an implicit setup, Serverpod discerns the relationship based on the table and class structures. The corresponding foreign key field is automatically integrated into the 'many' side (e.g., `Employee`) as a concealed column.

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation
```

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
```

### Explicit Definition

In an explicit definition, you directly specify the relationship and in a one-to-many relation this means specifying only the object:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
```

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  company: Company?, relation
```

You can also use a foreign key for this relationship:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
```

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int, relation
```

## Bidirectional Representation

For a more comprehensive representation, you can define the relationship from both sides. To link both sides together you need to specify the `name` keyword and give it a unique value. The value can be any arbitrary string but both sides need to match and the string should be unique.

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation(name = company_employees)
```

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int
  company: Company?, relation(name = company_employees, field = companyId)
```

Or, employ the parent-child setup:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>, relation(name = company_employees)
```

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int, relation(name = company_employees, parent = company)
```
