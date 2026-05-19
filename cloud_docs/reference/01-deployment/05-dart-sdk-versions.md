# Dart SDK version handling

Serverpod Cloud supports specific Dart SDK versions for building and deploying your applications. Understanding how SDK versions are determined and used is important for configuring your project correctly.

## Supported Dart SDK versions

Serverpod Cloud supports the following Dart SDK versions:

- **3.8.x**
- **3.9.x**
- **3.10.x**

The supported version range is `>=3.8.0 <3.11.0`. This means your project's SDK constraint must overlap with this range to be deployable.

## How SDK version is determined

The SDK version used for building your application is determined from your project's `pubspec.yaml` file. Serverpod Cloud reads the `environment.sdk` constraint from your `pubspec.yaml` and uses **the lowest allowed version** from that constraint that falls within the supported range.

### Version selection logic

1. Serverpod Cloud reads the `sdk` constraint from your `pubspec.yaml`
2. It validates that your constraint overlaps with the supported range (`>=3.8.0 <3.11.0`)
3. It selects the **lowest version** that satisfies both:
   - Your project's SDK constraint
   - The supported version range

This ensures compatibility while using the most conservative version that meets your requirements.

## Configuring your pubspec.yaml

Your `pubspec.yaml` must include an `environment.sdk` constraint. Here are examples of valid configurations:

### Example 1: Minimum version constraint

```yaml
name: my_serverpod_app

environment:
  sdk: ">=3.8.0 <4.0.0"

dependencies:
  serverpod: ^2.9.0
```

**Result:** Uses Dart SDK **3.8.0** (the lowest version in the supported range)

### Example 2: Specific minimum version

```yaml
name: my_serverpod_app

environment:
  sdk: ">=3.9.0 <4.0.0"

dependencies:
  serverpod: ^2.9.0
```

**Result:** Uses Dart SDK **3.9.0** (the lowest version that satisfies your constraint)

### Example 3: Version range

```yaml
name: my_serverpod_app

environment:
  sdk: ">=3.9.0 <3.11.0"

dependencies:
  serverpod: ^2.9.0
```

**Result:** Uses Dart SDK **3.9.0** (the lowest version in your range)

### Example 4: Caret constraint

```yaml
name: my_serverpod_app

environment:
  sdk: "^3.10.0"

dependencies:
  serverpod: ^2.9.0
```

**Result:** Uses Dart SDK **3.10.0** (the lowest version that satisfies `^3.10.0`, which is `>=3.10.0 <4.0.0`)

### Example 5: Exact version (not recommended)

```yaml
name: my_serverpod_app

environment:
  sdk: "3.9.5"

dependencies:
  serverpod: ^2.9.0
```

**Result:** Uses Dart SDK **3.9.5** (if available, otherwise the closest supported version)

## Invalid SDK constraints

The following constraints will cause deployment to fail:

### Too old

```yaml
environment:
  sdk: ">=3.7.0 <4.0.0"  # ❌ 3.7.0 is below the minimum supported version
```

### Too new

```yaml
environment:
  sdk: ">=3.11.0 <4.0.0"  # ❌ 3.11.0 is above the maximum supported version
```

### No overlap

```yaml
environment:
  sdk: ">=3.0.0 <3.8.0"  # ❌ No overlap with supported range (>=3.8.0 <3.11.0)
```

## Best practices

1. **Use a range that includes supported versions**: Specify `>=3.8.0 <4.0.0` or a narrower range like `>=3.9.0 <3.11.0` to ensure compatibility

2. **Be specific about minimum requirements**: If your code requires features from Dart 3.9, use `>=3.9.0` to ensure the correct version is used

3. **Avoid overly restrictive constraints**: Using exact versions like `3.9.5` can cause issues if that specific patch version isn't available

4. **Keep constraints up to date**: As Serverpod Cloud adds support for newer Dart versions, you can update your constraints accordingly

## Troubleshooting

### Deployment fails with "Unsupported SDK Version"

If you see an error like:

```
Unsupported sdk version constraint in package my_app: >=3.7.0 <4.0.0
```

Update your `pubspec.yaml` to use a supported SDK version:

```yaml
environment:
  sdk: ">=3.8.0 <4.0.0"
```

### Missing SDK constraint

If you see an error like:

```
No sdk constraint found in package my_app
```

Add an `environment.sdk` field to your `pubspec.yaml`:

```yaml
environment:
  sdk: ">=3.8.0 <4.0.0"
```

## Related documentation

- [Deploying Your Application](./01-deploying-your-application.md) - Learn how to deploy your Serverpod application
- [Handling Private Dependencies](./02-handling-private-dependencies.md) - Manage workspace dependencies
