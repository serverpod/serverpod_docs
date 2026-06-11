---
title: Custom domains
description: Custom domains attach to the web, API, or Insights surface of a Serverpod Cloud project, with automatic TLS and DNS-based verification.
---

# Custom domains

When you're ready to ship your project to real users, you'll want it reachable at `yourapp.com` rather than the `*.serverpod.space` defaults. Custom domains attach a domain you own to your project's web, API, or Insights surface, with automatic TLS and DNS-based verification.

Every Serverpod Cloud project gets default domains automatically. A project named `my-app` is reachable at:

| Service  | Default domain                             |
| -------- | ------------------------------------------ |
| Web      | `https://my-app.serverpod.space/`          |
| API      | `https://my-app.api.serverpod.space/`      |
| Insights | `https://my-app.insights.serverpod.space/` |

## Attach a custom domain

A custom domain points at one of the three surfaces:

- `web`: a Flutter web app or other content served by Serverpod's web server
- `api`: Serverpod endpoints your Flutter app or other clients call
- `insights`: the Serverpod Insights app (typically on a separate subdomain like `insights.example.com`)

Attach the domain to your project, specifying the target surface:

```bash
scloud domain attach example.com --target web
```

After attaching, the CLI prints DNS records to add at your registrar. For an apex domain like `example.com`, two records are needed:

```text
Custom domain attached successfully!

Complete the setup by adding the records to your DNS configuration

┌────────────────────────────────────────────────────────────────────────────────┐
│ Record type | Domain name | Value                                              │
│ ------------+-------------+--------------------------------------------------- │
│ ANAME       | example.com | my-app.api.serverpod.space                         │
│ TXT         | example.com | scloud-verify=cbe1f5cc-f176-4183-8142-e0585ad15999 │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

Each row corresponds to one record to add at your registrar:

- **ANAME (or ALIAS)**: points the domain at the Serverpod Cloud surface
- **TXT**: carries a verification token that Serverpod Cloud uses to confirm ownership

Plain CNAMEs aren't valid at the zone apex, which is why ANAME or ALIAS is required there. [Cloudflare](https://www.cloudflare.com/), [Route 53](https://aws.amazon.com/route53/), and [DNSimple](https://dnsimple.com/) all support ANAME or ALIAS records.

For a subdomain like `api.example.com`, a single CNAME record is enough:

```text
Custom domain attached successfully!

Complete the setup by adding the records to your DNS configuration

┌────────────────────────────────────────────────────────────┐
│ Record type | Domain name     | Value                      │
│ ------------+-----------------+--------------------------- │
│ CNAME       | api.example.com | my-app.api.serverpod.space │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Verify the domain

DNS changes typically propagate within a few minutes but can take up to 48 hours. Once propagation completes, Serverpod Cloud verifies the domain automatically.

To force a verification attempt without waiting:

```bash
scloud domain verify example.com
```

A successful verification triggers TLS certificate provisioning, which usually completes within the hour. Certificates are renewed automatically.

Once the domain is active, point your client at the new URL:

```dart
final client = Client('https://api.example.com');
```

## List custom domains

Show the domains attached to a project, with their target surface and verification status:

```bash
scloud domain list
```

## Detach a custom domain

Remove a custom domain from a project. The CLI prompts for confirmation before removing:

```bash
scloud domain detach example.com
```

## Troubleshooting

**Verification fails.** DNS records may be missing or still propagating. Confirm the records are in place at your registrar, then wait up to 48 hours and retry with `scloud domain verify <domain>`.

**Can't attach the domain.** The domain is already attached to another project. Detach it from that project first.

**TLS certificate errors.** TLS provisioning is still in progress. It usually completes within an hour of successful verification.

## Related

- [CLI reference: `domain` command](/cloud/reference/cli/commands/domain)
