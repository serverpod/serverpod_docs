---
title: Database backups
sidebar_position: 6
description: Database backups on Serverpod Cloud are point-in-time snapshots of the managed database, taken on demand or on a schedule and restorable in one step.
---

# Database backups

A bad migration or an accidental bulk delete can lose data you needed. Serverpod Cloud can take point-in-time snapshots of your managed database, on demand or on a recurring schedule, and restore the whole database to any snapshot in one step. Backups run on the platform, so there is nothing for you to host or maintain. Today you manage them with the `scloud` CLI, and support in the web console is coming.

:::info
Backups are available on the **Growth** plan. On other plans, creating a snapshot, setting a schedule, and restoring return an error that backups aren't available for the project's plan. Listing snapshots, deleting snapshots, and viewing or disabling the schedule work on any plan, so a project on a smaller plan can still see and clean up backups it already has.
:::

## When to use each kind of backup

Two kinds of backup cover different needs, and most projects use both.

- **Scheduled backups** run automatically at a frequency you choose. Set one up so the database always has recent recovery points, without anyone having to remember. This is the safety net most projects want.
- **Manual snapshots** are taken on demand. Take one right before a risky change, such as a large migration or a bulk data edit, so you have a known-good point to return to.

## Set up automatic backups

A schedule takes snapshots for you at a fixed frequency. Each database has one schedule. Set it with `scloud db schedule set` and a frequency of `daily`, `weekly`, or `monthly`:

```bash
scloud db schedule set --frequency weekly --day 1 --hour 3 --retention 30d
```

Use `--day` to pick the day of the week (1-7) for a weekly schedule or the day of the month (1-31) for a monthly one; it defaults to 1 and does not apply to a daily schedule. Use `--hour` for the hour of the day (0-23, in UTC); it defaults to 0. Use `--retention` (for example `30d`) to set how long each scheduled snapshot is kept before it is deleted automatically. Without `--retention`, scheduled snapshots are kept for the platform's default retention.

Cloud confirms the schedule it stored:

```text
Setting    | Value
-----------+--------
Frequency  | weekly
Hour (UTC) | 3
Day        | 1
Retention  | 30 days
```

To see the current schedule, run `scloud db schedule show`. To turn it off, run `scloud db schedule unset`.

## Create a manual snapshot

Take a one-off snapshot with `scloud db backup create`, for example just before applying a large migration:

```bash
scloud db backup create --name pre-migration --expire-in 7d
```

Both options are optional. The `--name` option labels the snapshot so you can recognize it later. The `--expire-in` option (for example `7d` or `24h`) sets how long the snapshot is kept before it is deleted automatically; leave it off to keep the snapshot until you delete it yourself.

## List your backups

Run `scloud db backup list` to see every snapshot and its ID:

```bash
scloud db backup list
```

```text
ID           | Name          | Type      | Created             | Expires             | Size
-------------+---------------+-----------+---------------------+---------------------+---------
snap-3f2a9c  | pre-migration | manual    | 2026-07-15 09:12:04 | 2026-07-22 09:12:04 | 512.0 MB
snap-9b71e0  |               | scheduled | 2026-07-15 03:00:01 | 2026-08-14 03:00:01 | 24.3 MB
```

The **Type** column shows whether a snapshot was taken manually or by the schedule. **Size** is the snapshot's full size. A scheduled snapshot's actual storage is smaller, because only the first snapshot in a schedule is a full copy and the rest keep just the changes since the previous one. Timestamps are shown in your local time zone; add `--utc` to show them in UTC.

## Restore from a backup

Restoring replaces the live database with the contents of a snapshot. Pass the snapshot ID from `scloud db backup list`:

```bash
scloud db backup restore snap-3f2a9c
```

Because this replaces live data, Cloud asks you to confirm first:

```text
WARNING: Restores the database for project "my-app" to snapshot "snap-3f2a9c".
The live database is replaced with the data from the snapshot.
The current state is retained by the provider as a separate backup.

Do you want to proceed?
```

The connection string and database credentials do not change, so your deployed server keeps working against the same database with no config change. The state from just before the restore is kept as a separate backup, so an accidental restore can itself be recovered from.

## Delete a snapshot

Remove a snapshot you no longer need with `scloud db backup delete` and its ID:

```bash
scloud db backup delete snap-3f2a9c
```

Cloud asks for confirmation, then deletes the snapshot permanently. Scheduled snapshots are removed automatically once they pass the schedule's retention, so you mostly delete manual snapshots this way.

## Pricing

Backup storage is billed separately from your regular database storage, as its own charge rather than counting against your database usage. It uses the same package pricing as database storage, $6 per 10 GB per month, prorated for partial months, and applies only on the Growth plan. A schedule usually costs less than keeping the same number of manual snapshots. Each manual snapshot is a full copy, while a scheduled series stores one full copy plus the changes between snapshots. For current plan pricing, see [Serverpod Cloud plans](https://serverpod.dev/cloud).

## Limits

- **Up to 100 manual snapshots per project.** Scheduled snapshots do not count towards this limit. When you reach it, creating another manual snapshot returns a clear error; delete snapshots you no longer need to make room.
- **Retention defaults.** A manual snapshot created without `--expire-in` is kept until you delete it. A scheduled snapshot created without `--retention` is kept for the platform's default retention, then deleted automatically.
- **Downgrading with stored backups.** A project that still has backups stored cannot move from the Growth plan to a smaller plan. Delete the backups first, then change the plan.

## Related

- [Database](/cloud/concepts/database): how the managed database is provisioned, connected, and reset.
- [`scloud db` CLI reference](/cloud/reference/cli/commands/db): every `db backup` and `db schedule` flag and default.
- [Migrations](/concepts/database/migrations#rolling-back-migrations): rolling a schema change back, which pairs with restoring data.
