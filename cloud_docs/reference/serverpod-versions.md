---
sidebar_position: 5
title: Serverpod versions
description: Which Serverpod versions Serverpod Cloud deploys, and why a project that runs more than one podlet should use Serverpod 3.3.0 or later.
---

# Serverpod versions

Serverpod Cloud checks your project's Serverpod version on every deploy, so the version decides whether the project deploys and whether it can safely run more than one [podlet](/cloud/concepts/compute).

## Supported versions

Here's what each Serverpod version supports on Cloud:

<div className="full-width-table">

| Serverpod version  | On Serverpod Cloud                                     |
| ------------------ | ------------------------------------------------------ |
| 3.3.0 or later     | Supported, including more than one podlet              |
| 2.3.0 to 3.2.x     | Supported. Use 3.3.0 or later for more than one podlet |
| Earlier than 2.3.0 | Not supported, and the deploy stops                    |

</div>

Serverpod 3.3.0 added the health check endpoints that Cloud uses when it starts, adds, and removes podlets. Without them, scaling and deploys can disrupt a project that runs more than one podlet.

## How the deploy checks the version

Each deploy reads the `serverpod` dependency in your server's `pubspec.yaml`. Every version its constraint allows must be 2.3.0 or later. A constraint such as `^2.2.0` stops the deploy, even if your lockfile resolves a later version:

```text
Unsupported serverpod version constraint: ^2.2.0 (must adher to: >=2.3.0)
```

If the constraint allows no version from 3.3.0 on, and your project's **Min podlets** or **Max podlets** is above 1, the deploy continues with this warning:

```text
Multiple podlets are enabled, but your Serverpod constraint does not allow it. Upgrade to Serverpod 3.3.0 or later to reduce the risk of disruption during scaling and deployment.
```

To clear either message, raise the `serverpod` constraint and upgrade the project. See [Upgrading](/upgrading) for the steps between major versions.

## Related documentation

- [Compute](/cloud/concepts/compute): podlet sizes and the autoscaling range.
- [Dart SDK versions](/cloud/reference/dart-sdk-versions): the Dart SDK versions Cloud builds with.
