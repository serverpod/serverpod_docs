---
title: Database backups
sidebar_position: 6
description: Database backups on Serverpod Cloud are point-in-time snapshots of the managed database, taken on demand or on a schedule and restorable in one step.
---

# Database backups

A bad migration or an accidental bulk delete can lose data you needed. Serverpod Cloud can take point-in-time snapshots of your managed database, on demand or on a recurring schedule, and restore the whole database to any snapshot in one step. Backups run on the platform, so there is nothing for you to host or maintain. You manage them with the Serverpod Cloud CLI.

:::info
Backups are a **Growth** plan feature. On Growth you can create snapshots, schedule backups, and restore. Listing snapshots, deleting snapshots, and viewing or disabling the schedule are available on every plan, so a project on a smaller plan can still see and clean up backups it already has.
:::

## When to use each kind of backup

Two kinds of backup cover different needs, and most projects use both.

- **Scheduled backups** run automatically at a frequency you choose. Set one up so the database always has recent recovery points, without anyone having to remember. This is the safety net most projects want.
- **Manual snapshots** are taken on demand. Take one right before a risky change, such as a large migration or a bulk data edit, so you have a known-good point to return to.

## Set up automatic backups

A schedule takes snapshots for you at a fixed frequency. Each database has one schedule. Set it with `serverpod cloud db schedule set` and a frequency of `daily`, `weekly`, or `monthly`:

```bash
serverpod cloud db schedule set --frequency weekly --day 1 --hour 3 --retention 30d
```

The other options:

- **`--day`** sets the day of the week (1-7) for a weekly schedule, or the day of the month (1-31) for a monthly one. It defaults to 1 and does not apply to a daily schedule.
- **`--hour`** sets the hour of the day, from 0 to 23 in UTC. It defaults to 0.
- **`--retention`** sets how long each scheduled snapshot is kept before it is deleted automatically, for example `30d`. New schedules keep them for 35 days, which is also the longest allowed. A schedule set before that default changed keeps 24 hours until you set a retention.

Cloud confirms the schedule it stored:

```text
Setting    | Value
-----------+--------
Frequency  | weekly
Hour (UTC) | 3
Day        | 1
Retention  | 30 days
```

To see the current schedule, run `serverpod cloud db schedule show`. To turn it off, run `serverpod cloud db schedule unset`.

## Create a manual snapshot

Take a one-off snapshot with `serverpod cloud db backup create`, for example just before applying a large migration:

```bash
serverpod cloud db backup create --name pre-migration --expire-in 7d
```

Both options are optional. The `--name` option labels the snapshot so you can recognize it later. The `--expire-in` option (for example `7d` or `24h`) sets how long the snapshot is kept before it is deleted automatically. Leave it off to keep the snapshot until you delete it yourself.

## List your backups

Run `serverpod cloud db backup list` to see every snapshot and its ID:

```bash
serverpod cloud db backup list
```

```text
ID           | Name          | Type      | Created (local)     | Expires (local)     | Size
-------------+---------------+-----------+---------------------+---------------------+---------
snap-3f2a9c  | pre-migration | manual    | 2026-07-15 09:12:04 | 2026-07-22 09:12:04 | 512.0 MB
snap-9b71e0  |               | scheduled | 2026-07-15 03:00:01 | 2026-08-14 03:00:01 | 24.3 MB
```

The **Type** column shows whether a snapshot was taken manually or by the schedule. **Size** is the snapshot's full size. A scheduled snapshot's actual storage is smaller, because only the first snapshot in a schedule is a full copy and the rest keep just the changes since the previous one. Timestamps are shown in your local time zone. Add `--utc` to show them in UTC.

## Restore from a backup

Restoring replaces the live database with the contents of a snapshot. Pass the snapshot ID from `serverpod cloud db backup list`:

```bash
serverpod cloud db backup restore snap-3f2a9c
```

Because this replaces live data, Cloud asks you to confirm first:

```text
WARNING: Restores the database for project "my-app" to snapshot "snap-3f2a9c".
The live database is replaced with the data from the snapshot.
This action cannot be undone.

Do you want to proceed?
```

To keep a copy of the current data, take a manual snapshot with `serverpod cloud db backup create` before you restore.

The connection string and database credentials do not change, so your deployed server keeps working against the same database with no config change.

## Delete a snapshot

Remove a snapshot you no longer need with `serverpod cloud db backup delete` and its ID:

```bash
serverpod cloud db backup delete snap-3f2a9c
```

Cloud asks for confirmation, then deletes the snapshot permanently. Scheduled snapshots are removed automatically once they pass the schedule's retention, so you mostly delete manual snapshots this way.

## Pricing

Backup storage is billed separately from your regular database storage, as its own metered charge rather than counting against your database usage. It is priced the same as database storage, billed by usage and prorated for partial months, and applies only on the Growth plan. A schedule usually costs less than keeping the same number of manual snapshots. Each manual snapshot is a full copy, while a scheduled series stores one full copy plus the changes between snapshots. For current plan pricing, see [Serverpod Cloud plans](https://serverpod.dev/cloud).

## Limits

- **Up to 100 manual snapshots per project.** Scheduled snapshots do not count towards this limit. When you reach it, creating another manual snapshot returns a clear error. Delete snapshots you no longer need to make room.
- **Retention defaults.** A manual snapshot created without `--expire-in` is kept until you delete it. A scheduled snapshot created without `--retention` is kept for 35 days, then deleted automatically. No schedule can keep snapshots longer than that.
- **Downgrading with stored backups.** A project that still has backups stored cannot move from the Growth plan to a smaller plan. Delete the backups first, then change the plan.

## Related

- [Database](/cloud/concepts/database): how the managed database is provisioned, connected, and reset.
- [CLI reference: `db` command](/cloud/reference/cli/commands/db): the full `db` command tree, including `db backup` and `db schedule`.
- [Migrations](/concepts/data-and-the-database/database/migrations#rolling-back-migrations): rolling a schema change back, which pairs with restoring data.
