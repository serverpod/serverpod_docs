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

In this example, there is a named relation holding the data on both sides of the relation. The field `nextId` is a nullable field that stores the id of the next post. It is nullable as it would be impossible to create the first entry if we already needed to have a post created. The next post represents the object on "this" side while the previous post is the corresponding object on the "other" side. Meaning that the previous post is connected to the `nextId` of the post that came before it.

## One-to-many

In a one-to-many self-referenced relation there is one object field connected to a list field. In this example we have modeled the relationship between a cat and her potential kittens. Each cat has at most `one` mother but can have `n` kittens, for brevity, we have only modeled the mother.

```yaml
class: Cat
table: cat
fields:
  name: String
  mother: Cat?, relation(name=cat_kittens, optional, onDelete=SetNull)
  kittens: List<Cat>?, relation(name=cat_kittens)
```

The field `motherId: int?` is injected into the dart class, the field is nullable since we marked the field `mother` as an `optional` relation. We can now find all the kittens by looking at the `motherId` of other cats which should match the `id` field of the current cat. The other cat can instead be found by looking at the `motherId` of the current cat and matching it against one other cat `id` field.

## Many-to-many

Let's imagine we have a system where we have members that can block other members. We would like to be able to query who I'm blocking and who is blocking me. This can be achieved by modeling the data as a many-to-many relation ship.

Each member has a list of all other members they are blocking and another list of all members that are blocking them. But since the list side needs to point to a foreign key and cannot point to another list directly, we have to define a junction table that holds the connection between the rows.

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

The junction table has an entry for who is blocking and another for who is getting blocked. Notice that the `blockedBy` field in the junction table is linked to the `blocking` field in the member table. We have also added a combined unique constraint on both the `blockedId` and `blockedById`, this makes sure we only ever have one entry per relation, meaning I can only block one other member one time.

The cascade delete means that if a member is deleted all the blocking entries are also removed for that member.
