# `domain`

The `scloud domain` command offers custom domain management for your Serverpod Cloud projects.

To attach a custom domain to [your linked project](project), run the `scloud domain attach` command:

```bash
scloud domain attach www.mydomain.com --target web
```

The valid targets are:

- `web`: Relic server (e.g. REST API or a Flutter web app)
- `api`: Serverpod endpoints
- `insights`: Serverpod insights

To complete the setup, follow these steps:

- Add a CNAME or ANAME record with the value of your domain (`www.mydomain.com` in the example above) to the DNS configuration for this domain.
- Wait for the update to propagate. This can take up to a few hours.
- Run the following command to verify the DNS record (Serverpod Cloud will also try to verify the record periodically):

```bash
scloud domain verify www.mydomain.com
```

- When verification succeeds, the custom domain will shortly become active.
- Run the following command to check the status:

```bash
    scloud domain list
```
