---
sidebar_position: 12
title: Plans and billing
description: Plans decide which features a Serverpod Cloud project can use, and the card and billing details on your account keep every project you own running.
---

# Plans and billing

Your project's plan decides which features it can use, such as custom domains and database backups, and how far its server and database can grow. You pick a plan when you create a project, and you can change it later. Every project you own is billed to the card and billing details on your Serverpod Cloud account.

## Choose a plan

Serverpod Cloud has two standard plans, Starter and Growth. Starter fits an app before launch or a side project. Growth fits production apps and includes features such as custom domains, database backups, future calls, and [team members](/cloud/concepts/account-and-access#project-teams). The [pricing page](https://serverpod.dev/pricing) lists what each plan includes and costs.

For needs beyond Growth, Serverpod also offers an Enterprise plan, which you arrange with the Serverpod team. The pricing page lists what it includes.

To see which plan your project is on, open its **Settings** in the [Serverpod Cloud console](https://console.serverpod.dev). The **Plan** section shows the plan's name. From the terminal, run `serverpod cloud project show` in your project's directory and look at the `Plan` row.

## Free trial

Your first Starter project includes a one-month free trial. You don't need a card or billing details until the trial ends.

Any other project, including every Growth project, needs a card and billing details when you create it. The **New project** page asks for whichever is missing.

To see when the trial ends, open the project's **Settings**. The **Plan** section shows the end date. Serverpod Cloud also emails you a reminder before it ends.

What happens when the trial ends depends on your account:

- **Billing is set up:** The project keeps running, and its monthly plan fee starts.
- **Billing isn't set up:** The project is [suspended](#why-is-my-project-suspended) right away.

To keep the project running, [set up billing](#set-up-billing) before the trial ends. Until you do, the console shows a **Set up billing** banner at the top.

## Set up billing

Your account needs a card to pay for your projects and billing details for your invoices. Your billing details are your billing address, plus your company name if you're billed as a business. Without them, an invoice can't be issued, and the project is [suspended](#why-is-my-project-suspended).

You need both to:

- Keep a project running after its [free trial](#free-trial)
- [Change a project's plan](#change-your-projects-plan)
- Create a project without a free trial

Projects you were invited to are billed to their owner, so they don't need your card or billing details.

To set up billing:

1. In the [Serverpod Cloud console](https://console.serverpod.dev), open the account menu at the right of the top bar, then select **Billing**. The **Set up billing** buttons open the same page.

   <!-- screenshot: cloud-console/account-menu-billing.png. Owner: docs team. Last verified: 2026-11-16 against console.serverpod.dev. -->
   <img src="/img/cloud-console/account-menu-billing.png" alt="The person icon at the right of the Serverpod Cloud console's top bar, with the account menu open below it, listing Billing, Account settings, Security, Theme, and Log out." width="337" />

2. Add your card under **Payment methods** and your billing address under **Billing info**. If you're billed as a business, select **Are you a business?** and add your company name.
3. Under **Billing emails**, add anyone else who should get billing messages, such as trial reminders and failed payments.
4. Select **Save**. Your billing info and billing emails are saved only when you do.

## Change your project's plan

You can move a project between Starter and Growth in either direction. The move changes which features the project can use and which monthly fee it pays.

### Before you start

Make sure:

- **You own the project:** Only the project's owner can change its plan. For anyone else, the **Upgrade plan** or **Edit plan** button is dimmed, and hovering it explains who can change the plan.
- **Billing is in order:** Your account has [billing details](#set-up-billing) and no overdue payment.

**Moving to Growth:** If the project is on its free trial, the move ends the trial.

**Moving to Starter:** First remove what Starter doesn't include:

- **Backups:** Turn off the backup schedule with `serverpod cloud db schedule unset`, then [delete every snapshot](/cloud/concepts/database-backups#delete-a-snapshot), including scheduled ones.
- **Custom domains:** [Detach them](/cloud/concepts/custom-domains#detach-a-custom-domain).
- **Team members:** [Remove each one](/cloud/concepts/account-and-access#remove-a-team-member) with `serverpod cloud project user revoke` followed by their email.
- **Storages:** [Delete storages](/cloud/concepts/storage#delete-a-storage) until two remain. Deleting a storage removes its files for good, so copy out anything you need first.

### Change the plan

1. In the [Serverpod Cloud console](https://console.serverpod.dev), open your project's **Settings**. On Starter, select **Upgrade plan** in the **Plan** section. On Growth, select **Edit plan**.
2. Under **Project plan**, choose the plan.
3. Review **Compute** and **Database**, because choosing a plan resets both to that plan's defaults, which are one small [podlet](/cloud/concepts/compute) (a running copy of your server) and the small database size. On Starter, the podlet scales to zero. On Growth, it keeps running.
4. Select **Save**.

The change usually applies within a minute or two. The **Plan** section then shows the new plan's name. If the project has been deployed, your server restarts with the new plan's settings.

If the console says "We couldn't confirm your plan change", refresh the page. If the **Plan** section still shows the old plan, check each point under [Before you start](#before-you-start). If you're moving to Starter, also check the **Moving to Starter** list.

## View your invoices

Your invoices are kept in your billing portal, a separate page that opens in a new tab. To open it, go to the [Billing page](https://console.serverpod.dev/account/billing) of the Serverpod Cloud console and select **View invoices**.

## Stop charges

A project's charges stop when you delete it, because deleting ends its plan right away. Moving the project to Starter doesn't stop them, since Starter has a monthly fee too. Fees are billed after the period they cover, so a last invoice still arrives for the time before the deletion.

Deleting a project removes its server, database, and stored files. It can't be undone, and the project ID can't be used again.

To delete a project, including a suspended one, open its **Settings** in the console and select **Delete project**. From the terminal, run `project delete` with the project ID:

```bash
serverpod cloud project delete my-app
```

## Troubleshooting

### What happens if a payment fails?

Serverpod Cloud charges your card for each invoice. When a payment fails, what happens next depends on the invoice:

- **The first invoice on a project's plan:** The project is suspended right away. This includes the first invoice after you change the project's plan, or after you switch your account between business and individual on **Billing**.
- **Later invoices:** You have 10 days to pay, counted from the day the payment first fails. Your billing emails get a message with the date the project will be suspended.

While a payment is overdue, the console shows **Payment overdue** at the top of every page. You can't create projects, add resources such as storages, or change a project's plan until it's paid. To pay, select **Manage billing** in that banner, then pay the overdue invoice in your billing portal.

### Why is my project suspended?

A suspended project's server stops, and you can't deploy to it until it's reactivated. When a project is suspended for payment or billing setup, your billing emails get a message, and they get another when it's reactivated.

The project's page shows **Project suspended** with the reason and a button, and the project list marks it **Suspended**. From the terminal, `serverpod cloud project show` prints the reason in its `Status` row.

What to do depends on the reason:

<div className="full-width-table">

| Reason                   | What happened                                                                                                            | To reactivate it                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Payment overdue          | An invoice wasn't paid in time                                                                                           | Select **Pay invoices** and pay the overdue invoices in your billing portal                        |
| Billing setup incomplete | Your account was missing a card or billing details when the free trial ended, or billing details when an invoice was due | [Set up billing](#set-up-billing)                                                                  |
| Usage cap exceeded       | A Starter project used more than its plan covers in the current billing period                                           | Wait for the billing period to end. The project is reactivated once that period's invoice is paid. |
| Subscription ended       | The project's plan ended                                                                                                 | Contact support from the **Need help?** menu in the console's top bar                              |
| By support               | Serverpod Cloud support suspended it                                                                                     | Contact support from the **Need help?** menu in the console's top bar                              |

</div>

You can't change a suspended project's plan. When the project is reactivated, its server starts again with its last deployment.

## Related

- [Compute](/cloud/concepts/compute): podlet sizes and the autoscaling range on Growth.
- [Scale to zero](/cloud/concepts/scale-to-zero): why Starter projects scale to zero when idle, and how to turn it on or off on Growth.
- [Database backups](/cloud/concepts/database-backups): the backups that Growth includes.
- [Storage](/cloud/concepts/storage): the storages each plan includes and their limits.
