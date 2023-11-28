# Self-relations

A self-referential or self-relation occurs when a table has a foreign key that references its own primary key within the same table. This creates a relationship between different rows within the same table.

## One-to-one

Imagine we have a blog and want to create links between our posts, where you can traverse forward and backward in the post history. Then we can create a self-referencing relation pointing to the next post in the chain. 

```yaml
class: Post
table: post
fields:
  content: String
  previous: Post?, relation(name=next_previous_post)
  nextId: int?
  next: Post?, relation(name=next_previous_post, field=nextId, onDelete=SetNull)
indexes:
  next_unique_idx:
    fields: nextId
    unique: true
```

In this example, there is a named relation holding the data on both sides of the relation. The field `nextId` is a nullable field that stores the id of the next post. It is nullable as it would be impossible to create the first entry if we already needed to have a post created. The next post is the 

## One-to-many

```yaml
class: Cat
table: cat
fields:
  name: String
  mother: Cat?, relation(name=cat_kittens, optional, onDelete=SetNull)
  kittens: List<Cat>?, relation(name=cat_kittens)
```

## Many-to-many


```yaml
class: Member
table: member
fields:
  name: String
  blocking: List<Blocking>?, relation(name=member_blocked_by_me)
  blockedBy: List<Blocking>?, relation(name=member_blocking_me)
```

```yaml
class: Blocking
table: blocking
fields:
  blocked: Member?, relation(name=member_blocking_me, onDelete=Cascade)
  blockedBy: Member?, relation(name=member_blocked_by_me, onDelete=Cascade)
indexes:
  blocking_blocked_unique_idx:
    fields: blockedId, blockedById
    unique: true
```
