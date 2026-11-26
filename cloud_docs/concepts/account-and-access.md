---
sidebar_position: 15
title: Account and access
description: Your Serverpod Cloud account is what you sign in with, in the console and the CLI, and a project's team is who else can deploy and manage that project.
---

# Account and access

Your Serverpod Cloud account is what you sign in with, in the console and the CLI. It holds your billing details and shows every place you're signed in, so you can sign out a device you no longer trust. To let other people deploy a project and change its settings, you add them to the project's team.

## Your account

You use one account for every project you own or are invited to.

### Create an account and sign in

[Sign up for Serverpod Cloud](https://console.serverpod.dev/auth/signup), then sign in to the [console](https://console.serverpod.dev) in your browser.

To sign the CLI in to your account, run:

```bash
serverpod cloud auth login
```

This opens a browser window where you sign in. To check which account the CLI is signed in as, run `serverpod cloud me`.

### Account settings

Your account settings are in the account menu at the right of the console's top bar, on these tabs:

<div className="full-width-table">

| Tab            | What it's for                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Billing**    | Your card and billing details. See [Plans and billing](/cloud/concepts/plans-and-billing#set-up-billing).                                   |
| **Vouchers**   | Redeem a voucher code to add credit to your account, and see your balance.                                                                  |
| **Settings**   | Your name and email.                                                                                                                        |
| **Security**   | Every place you're signed in, and your personal access tokens. See [Manage your sessions](#manage-your-sessions).                           |
| **App Stores** | The App Store Connect keys your projects use to upload iOS builds. See [App publishing](/cloud/concepts/app-publishing#connect-the-stores). |

</div>

### Manage your sessions

Every place you're signed in to Serverpod Cloud, in the console or the CLI, is a session. To see your sessions, along with your [personal access tokens](/cloud/concepts/personal-access-tokens), open the **Security** tab. Each row shows when the session or token was created and last used.

To sign out a device you no longer use or trust, open the menu at the end of its session's row, then select **Revoke**.

From the terminal, find the session's ID, then sign it out:

```bash
serverpod cloud auth list
serverpod cloud auth logout --token-id <token-id>
```

To sign out only the terminal you're in, run `serverpod cloud auth logout`. To sign out every session and revoke every token at once, run `serverpod cloud auth logout --all`.

For CI pipelines and scripts, sign in with a [personal access token](/cloud/concepts/personal-access-tokens#create-a-token) instead of signing in through the browser.

## Project teams

A project has one owner and any number of admins.

<div className="full-width-table">

| Role  | What they can do                                                                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner | Everything, including changing the plan and compute and connecting an app store. Pays for the project.                                                               |
| Admin | Everything except changing the plan or compute, or connecting an app store. That includes deploying, managing passwords and the database, and inviting other admins. |

</div>

To invite team members, a project needs a plan that includes them, such as [Growth](/cloud/concepts/plans-and-billing#choose-a-plan). On Starter, **Invite user** asks you to upgrade instead, and `serverpod cloud project user invite` fails with `Inviting users is not available for this project's plan.`

### Invite a team member

Open your project's **Settings** in the [Serverpod Cloud console](https://console.serverpod.dev) and select **Invite user** in the **Team** card. From the terminal:

```bash
serverpod cloud project user invite colleague@example.com
```

Someone who already has a Serverpod Cloud account gets access straight away. Anyone else gets an invitation email and shows as **Invited** until they sign up. If the email gets lost, select **Resend invitation** next to them.

To see who has access, open the **Team** card, or run `serverpod cloud project user list`.

### Remove a team member

Select **Remove** next to the person in the **Team** card, or run:

```bash
serverpod cloud project user revoke colleague@example.com
```

They lose access to the project right away. For someone still marked **Invited**, **Remove** withdraws the invitation.

## Related

- [Plans and billing](/cloud/concepts/plans-and-billing): what the Growth plan includes, and changing a project's plan.
- [Personal access tokens](/cloud/concepts/personal-access-tokens): signing in from CI and scripts.
- [CLI reference: `project` command](/cloud/reference/cli/commands/project): the `project user` commands.
- [CLI reference: `auth` command](/cloud/reference/cli/commands/auth): the `auth list` and `auth logout` commands.
