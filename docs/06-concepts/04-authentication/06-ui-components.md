---
sidebar_label: UI Components
description: Authentication UI components and controllers let you build sign-in, registration, and password flows, including the all-in-one SignInWidget.
---

# Authentication UI components

The authentication system provides a comprehensive set of UI components and controllers for building authentication interfaces. These components handle the complete authentication flow, including sign-in, registration, and password management.

## Overview

The UI component architecture consists of:

- **Common widgets**: Reusable widgets for building custom authentication interfaces.
- **Provider-specific widgets**: Pre-built UI components that are used in specific providers.
- **Controllers**: Business logic classes that can be used with custom UI.

## SignInWidget

The `SignInWidget` is an all-in-one widget that automatically detects available authentication providers and displays the appropriate sign-in options.

```dart
import 'package:flutter/material.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

class SignInPage extends StatelessWidget {
  final Client client;

  const SignInPage({required this.client, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SignInWidget(
        client: client,
        onAuthenticated: () {
          // Do something when the user is authenticated.
          //
          // NOTE: You should not navigate to the home screen here, otherwise
          // the user will have to sign in again every time they open the app.
        },
        onError: (error) {
          // Handle errors
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $error')),
          );
        },
      ),
    );
  }
}
```

### Disabling providers

It is not possible to forcefully enable a provider, since this depends on the configuration of the identity providers, as described in the [setup section](./setup#identity-providers-configuration).

But, even though the `SignInWidget` automatically detects enabled providers, you can disable specific providers if you want to hide them on the client, but still keep them available on the server.

This is useful if you want to gradually disable a provider, but still keep compatibility with older clients.

```dart
SignInWidget(
  client: client,
  disableEmailSignInWidget: false,
  disableGoogleSignInWidget: false,
  disableAppleSignInWidget: true, // Disable Apple sign-in
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
)
```

### Customizing SignInWidget

You can customize individual provider widgets:

```dart
final signInWidget = SignInWidget(
  client: client,
  emailSignInWidget: EmailSignInWidget(
    client: client,
    startScreen: EmailFlowScreen.login,
    // NOTE: When you opt-out of the internal widget, you need to provide your
    // own `onAuthenticated` and `onError` callbacks.
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  googleSignInWidget: GoogleSignInWidget(
    client: client,
    theme: GSIButtonTheme.filledBlack,
    scopes: const [
      ...GoogleAuthController.defaultScopes,
      'https://www.googleapis.com/auth/youtube',
    ],
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  appleSignInWidget: AppleSignInWidget(
    client: client,
    style: AppleButtonStyle.black,
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  onAuthenticated: _onAuthenticated,
  onError: _onError,
);

void _onAuthenticated() {
  // Handle successful authentication
}

void _onError(Object error) {
  // Handle errors
}
```

For more details on all options of each provider widget, see the "Customizing UI" section of the specific provider documentation. There you will also find information on how to build a custom UI with the controller. For example, see the [Email Provider](./providers/email/customizing-the-ui) documentation.

## Localization

All text shown by the authentication widgets is in English by default. To replace it, wrap `SignInWidget`, or any individual provider widget, in a `SignInLocalizationProvider` and pass the text objects for the parts you want to translate:

- `BasicSignInTexts` for the shared messages and dividers.
- `EmailSignInTexts` for the email flow: sign-in, registration, account verification, password reset, and the terms and privacy labels.
- `PasswordRequirementTexts` for the labels of the built-in password requirement widgets.
- One text object per provider for the sign-in buttons: `AppleSignInTexts`, `GoogleSignInTexts`, `GitHubSignInTexts`, `MicrosoftSignInTexts`, `FacebookSignInTexts`, and `AnonymousSignInTexts`.

The example below translates the full set into Brazilian Portuguese:

```dart
const basicTexts = BasicSignInTexts(
  noAuthenticationProvidersConfigured:
      'Nenhum provedor de autenticação configurado',
  orContinueWith: 'ou continue com',
);

const emailTexts = EmailSignInTexts(
  title: 'Entrar com e-mail',
  forgotPassword: 'Esqueceu sua senha?',
  signIn: 'Entrar',
  dontHaveAnAccount: 'Não tem uma conta?',
  signUp: 'Criar conta',
  signUpTitle: 'Criar conta com e-mail',
  continueAction: 'Continuar',
  alreadyHaveAnAccount: 'Já tem uma conta?',
  verifyAccountTitle: 'Verificar conta',
  verifyResetCodeTitle: 'Verificar código de redefinição',
  verificationMessage:
      'Enviamos um e-mail de verificação. Confira sua caixa de entrada e '
      'digite o código abaixo.',
  verify: 'Verificar',
  setAccountPasswordTitle: 'Definir senha da conta',
  passwordLabel: 'Senha',
  backToSignUp: 'Voltar para criar conta',
  setNewPasswordTitle: 'Definir nova senha',
  newPasswordLabel: 'Nova senha',
  resetPasswordTitle: 'Redefinir senha',
  resetPasswordDescription:
      'Digite o endereço de e-mail para redefinir sua senha.',
  requestPasswordReset: 'Solicitar redefinição de senha',
  resetPassword: 'Redefinir senha',
  backToSignIn: 'Voltar para entrar',
  emailLabel: 'E-mail',
  termsIntro: 'Li e aceito os ',
  termsAndConditions: 'Termos e Condições',
  andText: ' e a ',
  privacyPolicy: 'Política de Privacidade',
);

const passwordTexts = PasswordRequirementTexts(
  minLengthTemplate: 'Pelo menos {length} caracteres',
  maxLengthTemplate: 'No máximo {length} caracteres',
  containsLowercase: 'Contém pelo menos uma letra minúscula',
  containsUppercase: 'Contém pelo menos uma letra maiúscula',
  containsNumber: 'Contém pelo menos um número',
  containsSpecialCharacter: 'Contém pelo menos um caractere especial',
);

SignInLocalizationProvider(
  basic: basicTexts,
  email: emailTexts,
  passwordRequirementTexts: passwordTexts,
  apple: const AppleSignInTexts(signInButton: 'Entrar com Apple'),
  google: const GoogleSignInTexts(signInButton: 'Entrar com Google'),
  github: const GitHubSignInTexts(signInButton: 'Entrar com GitHub'),
  microsoft: const MicrosoftSignInTexts(signInButton: 'Entrar com Microsoft'),
  facebook: const FacebookSignInTexts(signInButton: 'Entrar com Facebook'),
  anonymous: const AnonymousSignInTexts(signInButton: 'Entrar como visitante'),
  child: SignInWidget(
    client: client,
    onAuthenticated: _onAuthenticated,
    onError: _onError,
  ),
);
```

The `{length}` placeholder in the two length templates is replaced with the configured limit, so keep it in the translated string.

### Translating part of the text

Any text object you leave out keeps its built-in English text, so you only need to pass the ones you are translating. To change a few values inside an object, start from its `defaults` constant:

```dart
SignInLocalizationProvider(
  email: EmailSignInTexts.defaults.copyWith(
    title: 'Entrar com e-mail',
    signIn: 'Entrar',
  ),
  child: signInWidget,
);
```

### Switching locale

`SignInLocalizationProvider` hands the text objects to the widgets below it. It does not read Flutter's current `Locale` or pick a translation for you. In an app that supports several locales, select the text objects with your existing localization setup and rebuild the provider when the locale changes.

:::note
The Firebase provider is not covered by these text objects. The `serverpod_auth_idp_flutter_firebase` package supplies a controller rather than a finished UI, so translate the widgets you build on top of it.
:::
