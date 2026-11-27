---
sidebar_position: 7
title: Custom domains
description: Custom domains attach to the web, API, or Insights surface of a Serverpod Cloud project, with automatic TLS and DNS-based verification.
---

# Custom domains

When you're ready to ship your project to real users, you might want it reachable at `yourapp.com` rather than the `*.serverpod.space` defaults. Custom domains attach a domain you own to your project's web, API, or Insights surface, with automatic TLS and DNS-based verification.

Every Serverpod Cloud project gets default domains automatically. A project named `my-app` is reachable at:

| Service  | Default domain                             |
| -------- | ------------------------------------------ |
| Web      | `https://my-app.serverpod.space/`          |
| API      | `https://my-app.api.serverpod.space/`      |
| Insights | `https://my-app.insights.serverpod.space/` |

## Attach a custom domain

Custom domains need the [**Growth** plan](/cloud/concepts/plans-and-billing).

A custom domain points at one of the three surfaces:

- **`web`:** A Flutter web app or other content served by Serverpod's web server.
- **`api`:** Serverpod endpoints your Flutter app or other clients call.
- **`insights`:** The Serverpod Insights app, typically on a separate subdomain like `insights.example.com`.

Attach the domain to your project, specifying the target surface:

```bash
serverpod cloud domain attach example.com --target web
```

After attaching, the CLI prints DNS records to add at your registrar. For an apex domain like `example.com`, which has no subdomain, it lists an ANAME and a TXT record. On the `web` target, it also lists a CNAME for `www.example.com`:

```text
Custom domain attached successfully!

Complete the setup by adding the following records to your DNS configuration:

┌────────────────────────────────────────────────────────────────────────────────────┐
│ Record type | Domain name     | Value                                              │
│ ------------+-----------------+--------------------------------------------------- │
│ ANAME       | example.com     | my-app.serverpod.space                             │
│ TXT         | example.com     | scloud-verify=cbe1f5cc-f176-4183-8142-e0585ad15999 │
│ CNAME       | www.example.com | my-app.serverpod.space                             │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Each row corresponds to one record to add at your registrar:

- **ANAME (or ALIAS):** Points the domain at the Serverpod Cloud surface.
- **TXT:** Carries a verification token that Serverpod Cloud uses to confirm ownership.
- **CNAME for `www` (`web` target only):** Makes `www.example.com` redirect to `example.com`. Serverpod Cloud also provisions a TLS certificate for `www.example.com`.

Plain CNAMEs aren't valid at the zone apex, which is why ANAME or ALIAS is required there. [Cloudflare](https://www.cloudflare.com/), [Route 53](https://aws.amazon.com/route53/), and [DNSimple](https://dnsimple.com/) all support ANAME or ALIAS records.

For a subdomain like `api.example.com`, a single CNAME record is enough:

```text
Custom domain attached successfully!

Complete the setup by adding the following records to your DNS configuration:

┌────────────────────────────────────────────────────────────┐
│ Record type | Domain name     | Value                      │
│ ------------+-----------------+--------------------------- │
│ CNAME       | api.example.com | my-app.api.serverpod.space │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Verify the domain

DNS changes typically propagate within a few minutes but can take up to 24 hours. Once propagation completes, Serverpod Cloud verifies the domain automatically.

To force a verification attempt without waiting:

```bash
serverpod cloud domain verify example.com
```

A successful verification triggers TLS certificate provisioning, which usually completes within the hour. Certificates are renewed automatically.

Once the domain is active, point your app's `Client` at the new URL:

```dart
final client = Client('https://api.example.com');
```

## List custom domains

Show the domains attached to a project, with their target surface and verification status:

```bash
serverpod cloud domain list
```

## Detach a custom domain

Remove a custom domain from a project. The CLI asks you to confirm before it removes the domain:

```bash
serverpod cloud domain detach example.com
```

## Troubleshooting

**Verification fails.** DNS records may be missing or still propagating. Confirm the records are in place at your registrar, then wait up to 24 hours and retry with `serverpod cloud domain verify <domain>`.

**Can't attach the domain.** If the CLI reports `Custom domains are not available for this project's plan.`, the project is on Starter. [Move it to Growth](/cloud/concepts/plans-and-billing#change-your-projects-plan) first. If it reports `The domain name is already in use.`, the domain is already attached to this project. Run `serverpod cloud domain list` to see it.

**TLS certificate errors.** TLS provisioning is still in progress. It usually completes within an hour of successful verification.

## Related

- [CLI reference: `domain` command](/cloud/reference/cli/commands/domain)
