---
title: Custom domains
---

# Custom domains

Serverpod Cloud automatically provides default domains for your projects, but you can also configure custom domains to use your own branded URLs.

## Default domains

Every Serverpod Cloud project automatically gets these domains:

| Service | Default Domain |
|---------|---------------|
| Web | `https://my-app.serverpod.space/` |
| API | `https://my-app.api.serverpod.space/` |
| Insights | `https://my-app.insights.serverpod.space/` |

## Prerequisites

Before setting up a custom domain in Serverpod Cloud, you need:

1. A registered domain name
2. Administrative access to your domain's DNS settings
3. A deployed Serverpod Cloud project

## Steps to attach a custom domain

1. **Choose which service to link your domain to**

   Decide whether your custom domain should point to your web server, API, or insights app.

   - **Web server**: This is where your public-facing web content is served. If you're building a website or web application with Serverpod's built-in web server, this is typically what you want your main domain to point to.

   - **API**: This is the entry point for your Serverpod's API server that your Flutter apps or other clients will communicate with. This is the domain used by all your endpoints.

   - **Insights**: This provides access to Serverpod Insights, which gives you visibility into your server's performance, logs, and metrics. This is typically used by developers and administrators rather than end users, so it's often set up on a separate subdomain like `insights.yourdomain.com`.

2. **Attach the domain to your Serverpod Cloud project**

   ```bash
   scloud domain attach example.com --target web
   ```

   Available targets are:
   - `web` - For the web server
   - `api` - For API endpoints
   - `insights` - For the Serverpod Insights app

3. **Configure your DNS settings**

   After attaching the domain, you'll receive specific DNS configuration instructions:

   **For a apex domain (example.com):**

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

   You'll need to add two records:
   - An ANAME (or ALIAS) record pointing your domain to the Serverpod domain
   - A TXT record with verification token (for domain ownership verification)

   **For a subdomain (api.example.com):**

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

   For subdomains, you'll typically only need to add a CNAME record.

4. **Verify your domain status**

   After updating your DNS settings, check the status of your domain:

   ```bash
   scloud domain list
   ```

   Once DNS propagation completes, your domain will be verified automatically.

5. **Manually verify your domain**

   If you've updated your DNS settings and want to force a verification, you can manually trigger verification:

   ```bash
   scloud domain verify example.com
   ```

   If verification succeeds, you'll see a confirmation message. If it fails, you'll receive information about what needs to be fixed in your DNS configuration.

## DNS configuration tips

### Using an apex domain

If you want to use a apex domain (like `example.com` without the `www`), note that it requires special DNS handling:

1. **Most DNS providers require ANAME/ALIAS records for apex domains**
   - Standard CNAME records don't work for apex domains
   - Providers like Cloudflare, Route53, DNSimple support ANAME/ALIAS records specifically for this purpose

2. **Verification requires a TXT record**
   - Apex domains need an additional TXT record with a verification token
   - This proves domain ownership to Serverpod Cloud

### DNS propagation

DNS changes can take anywhere from a few minutes to 48 hours to propagate globally. If your domain verification fails initially, wait a few hours and try again.

### SSL certificates

Serverpod Cloud automatically provisions and manages SSL certificates for your custom domains. No additional steps are required for HTTPS.

## Managing your custom domains

### List your custom domains

```bash
scloud domain list
```

This will show all your custom domains, their targets, and verification status.

### Detach a custom domain

```bash
scloud domain detach example.com
```

You'll be prompted to confirm the removal.

## Troubleshooting

| Issue | Possible Solution |
|-------|------------------|
| Verification fails | Check your DNS configuration and wait for propagation (up to 48 hours) |
| Can't attach domain | Ensure the domain isn't already in use by another project |
| SSL certificate errors | Wait for certificate provisioning to complete (usually within an hour) |

## 🧪 Example code

For clients using your custom domain for API:

```dart
// Initialize Serverpod client with custom domain
final client = Client('https://api.example.com');

// The rest of your code stays the same
final result = await client.example.hello('John Doe');
```
